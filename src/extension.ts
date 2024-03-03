import * as fs from 'fs/promises';
import * as path from 'path';
import * as vscode from 'vscode';
import constants from './constants';
import encode from './functions/encode';
import helper from './utility/vscode-helper';

/**
 * This method is called when the extension is activated
 *
 * @param vscode.ExtensionContext context
 * @return void
 */
export async function activate(context: vscode.ExtensionContext) {
	try {
		const manifestPath = path.resolve(__dirname, '../assets/manifest.json');
		const data = await fs.readFile(manifestPath, 'utf8');
		const manifest = JSON.parse(data);

		context.subscriptions.push(completionProvider(manifest), hoverProvider(manifest));
	} catch (err) {
		console.error('Failed to read manifest:', err);
	}
}

/**
 * Called whdn extension is deactivated
 *
 * @return void
 */
export function deactivate() {}

// -----------------------------------------------------------------------------

/**
 * Simplified completionProvider function by extracting repeated code into a separate function
 *
 * @param any manifest
 * @return vscode.Disposable
 */
function completionProvider(manifest: any = []) {
	return vscode.languages.registerCompletionItemProvider(
		constants.selectors,
		{
			provideCompletionItems: async (document: vscode.TextDocument, position: vscode.Position) => {
				const linePrefix = document.lineAt(position).text.substr(0, position.character);
				if (!linePrefix.includes('icon-')) return [];

				return manifest.map((item: any) => createCompletionItem(item, document.languageId, document, position));
			},
			// resolveCompletionItem: function (
			// 	item: vscode.CompletionItem & {
			// 		meta: any;
			// 	},
			// 	token: vscode.CancellationToken,
			// ): vscode.ProviderResult<vscode.CompletionItem> {
			// 	const previewSvg = createPreviewSvg(item.meta, true);

			// 	return {
			// 		...item,
			// 		documentation: new vscode.MarkdownString(`![preview](${previewSvg})`),
			// 		detail: item.meta.name,
			// 	};
			// },
		},
		'-',
	);
}

/**
 * Extracted method to create a completion item for the given icon
 *
 * @param object item
 * @param string languageId
 * @return vscode.CompletionItem
 */
function createCompletionItem(item: any, languageId: string, document: vscode.TextDocument, position: vscode.Position): vscode.CompletionItem & any {
	let svgText = item.svg;

	if (['css', 'scss', 'sass', 'less'].includes(languageId)) {
		svgText = `url("data:image/svg+xml;utf8,${encodeURIComponent(svgText)}")`;
	}

	const lineText = document.lineAt(position).text;
	const startIndex = lineText.lastIndexOf('icon-', position.character);
	const endIndex = startIndex + 'icon-'.length;
	const range = new vscode.Range(position.line, startIndex, position.line, endIndex);
	const additionalTextEdit = new vscode.TextEdit(range, '');

	return {
		additionalTextEdits: [additionalTextEdit],
		documentation: createPreviewSvg(item),
		insertText: svgText,
		kind: vscode.CompletionItemKind.Snippet,
		label: `icon-${item.name}`,
		meta: item,
		sortText: item.name,
	};
}

/**
 * Register a hover provider for SVG icon previews.
 * This is if a user hovers over text like "icon-001-cloud", it will show the image.
 *
 * @param {Array} manifest - The array of icon data loaded from the manifest.
 * @return {vscode.Disposable} - The hover provider registration.
 */
function hoverProvider(manifest: any) {
	return vscode.languages.registerHoverProvider(constants.selectors, {
		provideHover: async (document: vscode.TextDocument, position: vscode.Position) => {
			const regex = /icon-((\w|\-)+)/i;
			const range = document.getWordRangeAtPosition(position, regex);

			if (!range) return null;

			const word = document.getText(range);
			const match = regex.exec(word);

			if (!match) return null;

			const iconName = match[1];

			for (const item of manifest) {
				if (item.name.startsWith(iconName)) {
					return createHover(item, range);
				}
			}

			return null;
		},
	});
}

// -----------------------------------------------------------------------------

/**
 * Extracted method to create a hover with a preview of the SVG icon
 *
 * @param object item
 * @param vscode.Range range
 * @return vscode.Hover
 */
function createHover(item: any, range: vscode.Range): vscode.Hover {
	const icon = createPreviewSvg(item);

	return {
		contents: [icon, item.name],
		range: range,
	};
}

/**
 * Extracted method to create a MarkdownString with a preview of the SVG icon
 *
 * @param object item
 * @return vscode.MarkdownString
 */
function createPreviewSvg(item: any, svgOnly: boolean = false): vscode.MarkdownString | string {
	const svg = item.svg.replace(/fill="[^\"]+"/gi, '').replace(/<svg/gi, `<svg fill="${constants.icon.color}" `);
	const encodedSvg = `data:image/svg+xml;utf8;base64,${Buffer.from(svg).toString('base64')}${encode(` | width=${constants.icon.size} height=${constants.icon.size}`)}`;

	if (svgOnly) {
		return encodedSvg;
	}

	const markdownString = new vscode.MarkdownString(`![preview](${encodedSvg})`);
	markdownString.isTrusted = true;
	markdownString.supportHtml = true;
	markdownString.supportThemeIcons = true; // to supports codicons

	return markdownString;
}
