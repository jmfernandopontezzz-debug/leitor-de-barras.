import { n as fileStamp, r as formatFull } from "./routes-xGz6QilM.mjs";
import { a as Packer, c as ShadingType, d as TableRow, f as TextRun, i as Footer, l as Table, m as WidthType, n as BorderStyle, o as PageNumber, p as VerticalAlignTable, r as File$1, s as Paragraph, t as AlignmentType, u as TableCell } from "../_libs/docx.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/export-docx-CaHMCyvi.js
var INK = "1C241F";
var MUTED = "3F4C46";
var LINE = "D4CDBF";
var HEAD = "E7E1D4";
var PAPER = "FFFCF7";
var BAND = "F4F1E8";
var thin = {
	style: BorderStyle.SINGLE,
	size: 4,
	color: LINE
};
var borders = {
	top: thin,
	bottom: thin,
	left: thin,
	right: thin
};
var COLS = [
	780,
	5460,
	1680,
	2466
];
function cell(text, width, opts) {
	return new TableCell({
		width: {
			size: width,
			type: WidthType.DXA
		},
		verticalAlign: VerticalAlignTable.CENTER,
		borders,
		shading: {
			type: ShadingType.CLEAR,
			fill: opts.header ? HEAD : opts.band ? BAND : PAPER
		},
		margins: {
			top: 70,
			bottom: 70,
			left: 90,
			right: 90
		},
		children: [new Paragraph({ children: [new TextRun({
			text,
			bold: opts.header,
			font: opts.mono ? "Consolas" : "Calibri",
			size: opts.header ? 18 : 21,
			color: opts.header ? MUTED : INK
		})] })]
	});
}
async function buildDocxBlob(rows) {
	const when = formatFull(Date.now());
	const countLabel = rows.length === 1 ? "1 leitura" : `${rows.length} leituras`;
	const header = new TableRow({
		tableHeader: true,
		cantSplit: true,
		children: [
			cell("Nº", COLS[0], { header: true }),
			cell("Código", COLS[1], { header: true }),
			cell("Formato", COLS[2], { header: true }),
			cell("Data e hora", COLS[3], { header: true })
		]
	});
	const body = rows.map((row, index) => {
		const band = index % 2 === 1;
		return new TableRow({
			cantSplit: true,
			children: [
				cell(String(index + 1), COLS[0], { band }),
				cell(row.code, COLS[1], {
					band,
					mono: true
				}),
				cell(row.format, COLS[2], { band }),
				cell(formatFull(row.scannedAt), COLS[3], { band })
			]
		});
	});
	const doc = new File$1({
		creator: "Leitor de Barras",
		title: "Planilha de códigos de barras",
		description: "Códigos lidos, um por linha.",
		sections: [{
			properties: { page: {
				size: {
					width: 11906,
					height: 16838
				},
				margin: {
					top: 851,
					right: 720,
					bottom: 851,
					left: 720
				}
			} },
			footers: { default: new Footer({ children: [new Paragraph({
				alignment: AlignmentType.RIGHT,
				children: [new TextRun({
					children: ["Página ", PageNumber.CURRENT],
					font: "Calibri",
					size: 16,
					color: MUTED
				})]
			})] }) },
			children: [
				new Paragraph({
					spacing: { after: 80 },
					children: [new TextRun({
						text: "Planilha de códigos de barras",
						bold: true,
						font: "Calibri",
						size: 36,
						color: "10261A"
					})]
				}),
				new Paragraph({
					spacing: { after: 80 },
					children: [new TextRun({
						text: "Cada leitura fica em uma linha, na ordem em que foi feita.",
						font: "Calibri",
						size: 21,
						color: MUTED
					})]
				}),
				new Paragraph({
					spacing: { after: 280 },
					children: [new TextRun({
						text: `${countLabel} · gerado em ${when}`,
						font: "Calibri",
						size: 20,
						color: MUTED
					})]
				}),
				new Table({
					width: {
						size: COLS.reduce((sum, n) => sum + n, 0),
						type: WidthType.DXA
					},
					columnWidths: [...COLS],
					rows: [header, ...body]
				})
			]
		}]
	});
	return Packer.toBlob(doc);
}
async function exportDocx(rows) {
	const blob = await buildDocxBlob(rows);
	const filename = `planilha-codigos-${fileStamp()}.docx`;
	const file = new File([blob], filename, { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
	if (typeof navigator.share === "function" && typeof navigator.canShare === "function") try {
		if (navigator.canShare({ files: [file] })) {
			await navigator.share({
				files: [file],
				title: "Planilha de códigos"
			});
			return "shared";
		}
	} catch (err) {
		if (err instanceof DOMException && err.name === "AbortError") return "cancelled";
	}
	const url = URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.href = url;
	link.download = filename;
	document.body.appendChild(link);
	link.click();
	link.remove();
	window.setTimeout(() => URL.revokeObjectURL(url), 2500);
	return "downloaded";
}
//#endregion
export { exportDocx };
