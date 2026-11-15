"""Modelos de risco semanal: logística, gradient boosting (HistGradientBoosting) e duas referências ingênuas.

Uso: python scripts/risco_modelo.py      (precisa de dados/risco/features.npz, de risco_features.py; scikit-learn)

Divisão cronológica por ano da data de emissão: treino 2012–2021, validação 2022–2023 (hiperparâmetros, calibração
isotônica, limiar), teste 2024–2025 (só avaliado no fim). As variáveis de histórico (climatologia da semana, recorrência)
já vêm calculadas só com anos anteriores ao da emissão.

Saídas: dados/risco/modelo.npz (probabilidades de teste e de 2026, contribuições locais) e dados/risco/metricas.json.
"""

import json
import os
import sys
import time

import numpy as np
from sklearn.ensemble import HistGradientBoostingClassifier
from sklearn.isotonic import IsotonicRegression
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import average_precision_score, brier_score_loss, roc_auc_score

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
D = os.path.join(ROOT, "dados", "risco")
SEED = 0
LOG1P = ["chuva_7d", "chuva_30d", "dias_secos", "dias_fogo_30d"]
PREV = ["prev_tmax", "prev_ur", "prev_chuva", "prev_vento"]
LATLON = ["lat", "lon"]


def metricas(y, p, limiares):
    o = {"pr_auc": float(average_precision_score(y, p)), "roc_auc": float(roc_auc_score(y, p)),
         "brier": float(brier_score_loss(y, np.clip(p, 0, 1))), "n": int(len(y)), "taxa_base": float(y.mean())}
    o["limiares"] = []
    for t in limiares:
        s = p >= t
        tp = int((s & (y == 1)).sum())
        o["limiares"].append({"limiar": round(float(t), 4), "precisao": tp / max(int(s.sum()), 1), "recall": tp / max(int(y.sum()), 1),
                              "frac_alerta": float(s.mean())})
    return o


def confiabilidade(y, p, nb=10):
    b = np.clip((p * nb).astype(int), 0, nb - 1)
    out = []
    for k in range(nb):
        m = b == k
        if m.sum():
            out.append({"faixa": [k / nb, (k + 1) / nb], "n": int(m.sum()), "prev_media": float(p[m].mean()), "obs": float(y[m].mean())})
    return out


def melhor_limiar_f1(y, p):
    ts = np.linspace(0.05, 0.95, 91)
    f1 = []
    for t in ts:
        s = p >= t
        tp = (s & (y == 1)).sum()
        pr, rc = tp / max(s.sum(), 1), tp / max(y.sum(), 1)
        f1.append(2 * pr * rc / max(pr + rc, 1e-9))
    return float(ts[int(np.argmax(f1))])


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    z = np.load(os.path.join(D, "features.npz"))
    X3, y2, ano, sem = z["X"], z["y"], z["ano"], z["semana"]
    nomes = list(z["nomes"])
    NE, NC, NF = X3.shape
    for k in LOG1P:
        X3[:, :, nomes.index(k)] = np.log1p(np.maximum(X3[:, :, nomes.index(k)], 0))
    A = np.repeat(ano, NC)
    X = X3.reshape(-1, NF)
    y = y2.reshape(-1)
    tr, va, te = (A >= 2012) & (A <= 2021), (A >= 2022) & (A <= 2023), (A >= 2024) & (A <= 2025)
    novo = A == 2026
    base = [n for n in nomes if n not in PREV + LATLON]
    conj = {"base": base, "com_latlon": base + LATLON, "previsao_perfeita": base + PREV}
    ix = lambda cols: [nomes.index(c) for c in cols]
    print("linhas treino/val/teste", tr.sum(), va.sum(), te.sum(), flush=True)
    res = {"divisao": {"treino": "2012–2021", "validacao": "2022–2023", "teste": "2024–2025"},
           "n": {"treino": int(tr.sum()), "validacao": int(va.sum()), "teste": int(te.sum())},
           "taxa_base": {"treino": float(y[tr].mean()), "validacao": float(y[va].mean()), "teste": float(y[te].mean())},
           "variaveis": conj, "modelos": {}}
    LIM = [0.3, 0.5, 0.7]

    def avaliar(nome, pva, pte, rotulo, extra=None):
        iso = IsotonicRegression(out_of_bounds="clip", y_min=0, y_max=1).fit(pva, y[va])
        pva_c, pte_c = iso.predict(pva), iso.predict(pte)
        t = melhor_limiar_f1(y[va], pva_c)
        r = {"rotulo": rotulo, "validacao": metricas(y[va], pva_c, [t]), "teste_bruto": metricas(y[te], pte, LIM),
             "teste": metricas(y[te], pte_c, LIM + [t]), "limiar_validacao": t,
             "confiabilidade_bruta": confiabilidade(y[te], pte), "confiabilidade_calibrada": confiabilidade(y[te], pte_c)}
        if extra:
            r.update(extra)
        res["modelos"][nome] = r
        print(f"{nome}: teste PR-AUC {r['teste']['pr_auc']:.4f} ROC {r['teste']['roc_auc']:.4f} Brier bruto {r['teste_bruto']['brier']:.4f} calibrado {r['teste']['brier']:.4f}", flush=True)
        return iso

    # referências ingênuas
    clim = X[:, nomes.index("clim_semana")]
    avaliar("climatologia", clim[va], clim[te], "Climatologia (fração de anos anteriores com fogo na mesma semana)")
    pers = (X[:, nomes.index("focos_7d")] > 0).astype(np.float64)
    avaliar("persistencia", pers[va], pers[te], "Persistência (houve foco nos 7 dias anteriores)")

    # regressão logística
    def logistica(cols):
        c = ix(cols)
        mu, sd = X[tr][:, c].mean(0), X[tr][:, c].std(0) + 1e-9
        Z = lambda m: (X[m][:, c] - mu) / sd
        Ztr, Zva = Z(tr), Z(va)
        best = None
        for C in [0.001, 0.01, 0.1, 1.0]:
            m = LogisticRegression(C=C, max_iter=500).fit(Ztr, y[tr])
            ap = average_precision_score(y[va], m.predict_proba(Zva)[:, 1])
            print(f"  logística C={C}: val PR-AUC {ap:.4f}", flush=True)
            if best is None or ap > best[0]:
                best = (ap, C, m)
        return best[2], best[1], mu, sd, c

    t0 = time.time()
    lg, C, mu, sd, cl = logistica(base)
    Zf = lambda m: (X[m][:, cl] - mu) / sd
    plg_va, plg_te = lg.predict_proba(Zf(va))[:, 1], lg.predict_proba(Zf(te))[:, 1]
    iso_lg = avaliar("logistica", plg_va, plg_te, "Regressão logística", {
        "C": C, "coeficientes_padronizados": dict(zip(base, map(float, lg.coef_[0]))), "intercepto": float(lg.intercept_[0])})
    print("  tempo", round(time.time() - t0), "s", flush=True)

    # gradient boosting
    def hgb(cols, grade):
        c = ix(cols)
        best = None
        for lr, leaves in grade:
            m = HistGradientBoostingClassifier(max_iter=300, learning_rate=lr, max_leaf_nodes=leaves, min_samples_leaf=200,
                                               l2_regularization=1.0, early_stopping=False, random_state=SEED).fit(X[tr][:, c], y[tr])
            ap = average_precision_score(y[va], m.predict_proba(X[va][:, c])[:, 1])
            print(f"  HGB {cols is base and 'base' or len(cols)} lr={lr} folhas={leaves}: val PR-AUC {ap:.4f}", flush=True)
            if best is None or ap > best[0]:
                best = (ap, (lr, leaves), m)
        return best[2], best[1], c

    t0 = time.time()
    gb, hp, cg = hgb(base, [(0.05, 31), (0.1, 31), (0.05, 63), (0.1, 63)])
    pgb_va, pgb_te = gb.predict_proba(X[va][:, cg])[:, 1], gb.predict_proba(X[te][:, cg])[:, 1]
    iso_gb = avaliar("gbm", pgb_va, pgb_te, "Gradient boosting (HistGradientBoosting)", {"hiperparametros": {"learning_rate": hp[0], "max_leaf_nodes": hp[1], "max_iter": 300, "min_samples_leaf": 200, "l2_regularization": 1.0}})
    print("  tempo", round(time.time() - t0), "s", flush=True)

    # importância por permutação (validação, amostra), queda de PR-AUC
    rng = np.random.default_rng(SEED)
    iv = np.where(va)[0]
    s = rng.choice(iv, size=min(300000, len(iv)), replace=False)
    Xs, ys = X[s][:, cg], y[s]
    ap0 = average_precision_score(ys, gb.predict_proba(Xs)[:, 1])
    imp = {}
    for k, nm in enumerate(base):
        Xp = Xs.copy()
        Xp[:, k] = rng.permutation(Xp[:, k])
        imp[nm] = float(ap0 - average_precision_score(ys, gb.predict_proba(Xp)[:, 1]))
    res["modelos"]["gbm"]["importancia_permutacao"] = imp
    print("  importância:", sorted(imp.items(), key=lambda kv: -kv[1])[:6], flush=True)

    # variantes (gradient boosting com os mesmos hiperparâmetros)
    for nome, rot in [("com_latlon", "Gradient boosting + latitude/longitude"),
                      ("previsao_perfeita", "Gradient boosting com previsão do tempo perfeita (limite superior)")]:
        m, _, cc = hgb(conj[nome], [hp])
        avaliar(nome, m.predict_proba(X[va][:, cc])[:, 1], m.predict_proba(X[te][:, cc])[:, 1], rot)

    # escolha do modelo do mapa: maior PR-AUC na validação entre logística e GBM (já calibrados)
    escolha = "gbm" if res["modelos"]["gbm"]["validacao"]["pr_auc"] >= res["modelos"]["logistica"]["validacao"]["pr_auc"] else "logistica"
    res["modelo_mapa"] = escolha

    # previsões e contribuições locais para teste + 2026
    alvo = te | novo
    Xa = X[alvo][:, cg]
    p_gb = iso_gb.predict(gb.predict_proba(Xa)[:, 1])
    p_lg = iso_lg.predict(lg.predict_proba((X[alvo][:, cl] - mu) / sd)[:, 1])
    # GBM: oclusão — troca a variável pela mediana da validação e mede a mudança no log-odds bruto
    med = np.median(X[va][:, cg], axis=0)
    lo = lambda p: np.log(np.clip(p, 1e-6, 1 - 1e-6) / np.clip(1 - p, 1e-6, 1))
    l0 = lo(gb.predict_proba(Xa)[:, 1])
    contrib_gb = np.zeros((len(Xa), len(base)), np.float32)
    for k in range(len(base)):
        Xo = Xa.copy()
        Xo[:, k] = med[k]
        contrib_gb[:, k] = l0 - lo(gb.predict_proba(Xo)[:, 1])
    contrib_lg = (((X[alvo][:, cl] - mu) / sd) * lg.coef_[0]).astype(np.float32)
    ne = int(alvo.sum() // NC)
    top = lambda c: np.argsort(-c, axis=1)[:, :3].astype(np.uint8).reshape(ne, NC, 3)
    np.savez(os.path.join(D, "modelo.npz"), p_gbm=p_gb.reshape(ne, NC).astype(np.float32), p_log=p_lg.reshape(ne, NC).astype(np.float32),
             top_gbm=top(contrib_gb), top_log=top(contrib_lg),
             topv_gbm=np.take_along_axis(contrib_gb, np.argsort(-contrib_gb, axis=1)[:, :3], 1).reshape(ne, NC, 3),
             topv_log=np.take_along_axis(contrib_lg, np.argsort(-contrib_lg, axis=1)[:, :3], 1).reshape(ne, NC, 3),
             y=y[alvo].reshape(ne, NC), emissao=z["emissao"][np.unique(np.where(alvo.reshape(NE, NC))[0])], nomes=np.array(base))
    with open(os.path.join(D, "metricas.json"), "w", encoding="utf-8") as f:
        json.dump(res, f, ensure_ascii=False, indent=1)
    print("modelo do mapa:", escolha, "ok")


if __name__ == "__main__":
    main()
