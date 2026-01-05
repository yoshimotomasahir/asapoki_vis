const CONST = {
    dan_to_bai: 20,              // 1段 = 20倍
    bai_to_unit: 8,              // 1倍 = 8ユニット
    bai_to_mils: 84.8,           // 1倍 = 84.8ミルス
    gyo_to_mils: 214.4,          // 1行 = 214.4ミルス
    mm_to_mils: 1 / 0.0254,      // 25.4mm = 1000ミルス = 1インチ
    paper_height_mils: 20352,    // 240倍
    paper_width_mils: 15154.28   // 固定値 (約70.68行)
};

const applyRounding = (v, mode) => {
    if (!Number.isFinite(v)) return "";
    if (mode === "none") return v;
    if (mode === "int") return Math.round(v);
    const step = parseFloat(mode);
    const decimals = Math.max(0, Math.round(-Math.log10(step)));
    const rounded = Math.round(v / step) * step;
    return rounded.toFixed(decimals);
};

function convertUnit(kind, value) {
    // 1) すべてミルスに正規化
    let mils;
    switch (kind) {
        case "dan":
            mils = value * CONST.dan_to_bai * CONST.bai_to_mils;
            break;
        case "bai":
            mils = value * CONST.bai_to_mils;
            break;
        case "unit":
            mils = (value / CONST.bai_to_unit) * CONST.bai_to_mils;
            break;
        case "mils":
            mils = value;
            break;
        case "gyo":
            mils = value * CONST.gyo_to_mils;
            break;
        case "mm":
            mils = value * CONST.mm_to_mils;
            break;
        case "cm":
            mils = value * CONST.mm_to_mils * 10;
            break;
        case "full-width":
            mils = value * CONST.paper_width_mils;
            break;
        case "full-height":
            mils = value * CONST.paper_height_mils;
            break;
        default:
            return;
    }

    // 2) ミルスから各単位へ展開
    const outMils = mils;
    const outBai = mils / CONST.bai_to_mils;
    const outDan = outBai / CONST.dan_to_bai;
    const outUnit = outBai * CONST.bai_to_unit;
    const outGyo = mils / CONST.gyo_to_mils;
    const outMm = mils / CONST.mm_to_mils;
    const outCm = outMm / 10.0;

    return {
        mils: outMils,
        bai: outBai,
        dan: outDan,
        unit: outUnit,
        gyo: outGyo,
        mm: outMm,
        cm: outCm
    };
}

document.getElementById("btn-convert")?.addEventListener("click", () => {
    const kind = document.getElementById("input-kind").value;
    const value = parseFloat(document.getElementById("input-value").value);
    const rounding = document.getElementById("rounding").value;

    if (!Number.isFinite(value)) return;

    const ret = convertUnit(kind, value);
    drawSquareFromConverted(kind, value);

    document.getElementById("out-dan").value = applyRounding(ret.dan, rounding);
    document.getElementById("out-bai").value = applyRounding(ret.bai, rounding);
    document.getElementById("out-unit").value = applyRounding(ret.unit, rounding);
    document.getElementById("out-mils").value = applyRounding(ret.mils, rounding);
    document.getElementById("out-gyo").value = applyRounding(ret.gyo, rounding);
    document.getElementById("out-mm").value = applyRounding(ret.mm, rounding);
    document.getElementById("out-cm").value = applyRounding(ret.cm, rounding);
});

document.getElementById("btn-clear")?.addEventListener("click", () => {
    ["out-dan", "out-bai", "out-unit", "out-mils", "out-gyo", "out-mm", "out-cm", "input-value"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = "";
    });
});

const KIND_LABEL = {
    dan: "段",
    bai: "倍",
    unit: "ユニット",
    mils: "ミルス",
    gyo: "行",
    mm: "mm",
    cm: "cm",
    "full-width": "全幅",
    "full-height": "全高"
};

function drawSquareFromConverted(kind, value) {
    // --- 1) 入力→mils（長さ）に正規化 ---
    const conv = convertUnit(kind, value);
    if (!conv || !Number.isFinite(conv.mils)) return;

    const sizeMils = conv.mils;

    // --- 2) 紙面枠（初回だけ初期化） ---
    const paperEl = document.getElementById("paper");
    if (!paperEl) return;

    // 画面上の紙面表示幅(px)（内側の描画領域）
    const paperInnerWpx = 500;
    const paperAspect = CONST.paper_height_mils / CONST.paper_width_mils;
    const paperInnerHpx = Math.round(paperInnerWpx * paperAspect);

    // mils -> px の倍率（内側幅基準）
    const milsToPx = paperInnerWpx / CONST.paper_width_mils;

    // 外枠(1px)を考慮した要素サイズ
    const paperWpx = paperInnerWpx + 2;
    const paperHpx = paperInnerHpx + 2;

    // 初回だけ：枠線・段罫線（横罫線）を描画
    if (!paperEl.dataset.inited) {
        paperEl.dataset.inited = "1";
        paperEl.style.position = "relative";
        paperEl.style.width = paperWpx + "px";
        paperEl.style.height = paperHpx + "px";
        paperEl.style.border = "1px solid #000";
        paperEl.style.backgroundColor = "#fff";

        const borderInset = 1; // 枠線(1px)の内側に揃える

        // 横罫線（段境界）を引く：dan=1..11（12段なので境界は11本）
        const rulePad = 5;

        const createHRule = (x, y, w) => {
            const d = document.createElement("div");
            d.className = "hrule";
            d.style.position = "absolute";
            d.style.left = (x + borderInset) + "px";
            d.style.top = (y + borderInset) + "px";
            d.style.width = w + "px";
            d.style.height = "0px";
            d.style.borderTop = "1px solid #aaa";
            paperEl.appendChild(d);
        };

        for (let dan = 1; dan < 12; dan++) {
            const yMils = convertUnit("dan", dan).mils;
            const yPx = yMils * milsToPx;
            createHRule(rulePad, yPx, paperInnerWpx - rulePad * 2);
        }
    }

    // --- 3) 正方形（だけ）をクリアして再描画 ---
    paperEl.querySelectorAll(".sq").forEach(el => el.remove());

    // 正方形のサイズ(px)
    const cellWpx = sizeMils * milsToPx;

    // 縦方向セル高(px)：入力が行なら「1段高」を使う
    const oneDanMils = convertUnit("dan", 1).mils;
    const cellHpx = (kind === "gyo") ? (oneDanMils * milsToPx) : cellWpx;
    const paperCommentEl = document.getElementById("paper-comment");
    paperCommentEl.textContent = (kind === "gyo") ? 
    `${value}${KIND_LABEL[kind]} x 1段 の 紙面上のサイズ`:
    `${value}${KIND_LABEL[kind]} x ${value}${KIND_LABEL[kind]} の 紙面上のサイズ`;

    // 右上から左/下に並べる個数上限
    const maxCols = 11;
    const maxRows = 11;

    // 右上基準（内側描画領域で計算、枠線内側に配置）
    const borderInset = 1;
    const originX = paperInnerWpx - cellWpx - 3; // 右上セルの左上x（内側基準、両端の隙間を考慮）
    const originY = 0;                           // 右上セルの左上y（内側基準）

    const createSq = (x, y) => {
        const d = document.createElement("div");
        d.className = "sq";
        d.style.position = "absolute";
        d.style.left = (x + borderInset) + "px";
        d.style.top = (y + borderInset) + "px";
        d.style.width = (cellWpx - 1) + "px";
        d.style.height = (cellHpx - 1) + "px";
        d.style.border = "1px solid #f00";
        paperEl.appendChild(d);
    };

    // 右上の1個
    createSq(originX, originY);

    // 左方向（右上から左へ）
    for (let col = 1; col <= maxCols; col++) {
        const x = originX - col * cellWpx;
        if (x < 0) break;
        createSq(x, originY);
    }

    // 下方向（右上から下へ）
    for (let row = 1; row <= maxRows; row++) {
        const y = originY + row * cellHpx;
        if (y + cellHpx > paperInnerHpx) break;
        createSq(originX, y);
    }
}