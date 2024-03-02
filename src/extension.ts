import * as fs from 'fs/promises';
import * as path from 'path';
import * as vscode from 'vscode';
import constants from './constants';
import encode from './functions/encode';

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

export function deactivate() {}

/**
 * Simplified hoverProvider function by extracting repeated code into a separate function
 *
 * @param any manifest
 * @return vscode.Disposable
 */
function hoverProvider(manifest: any = []) {
	return vscode.languages.registerHoverProvider(constants.selectors, {
		provideHover: async (document: vscode.TextDocument, position: vscode.Position) => {
			const regex = /icon-((\w|\-)+)/i;
			const range = document.getWordRangeAtPosition(position, regex);
			if (!range) return null;

			const word = document.getText(range);
			const match = regex.exec(word);
			if (!match) return null;

			const iconName = match[1];
			const item = manifest.find((item: any) => iconName === item.name);
			if (!item) return null;

			return createHover(item, range);
		},
	});
}

/**
 * Extracted method to create a hover with a preview of the SVG icon
 *
 * @param object item
 * @param vscode.Range range
 * @return vscode.Hover
 */
function createHover(item: any, range: vscode.Range): vscode.Hover {
	const svg = item.svg.replace(/<path/gi, `<path fill="${constants.icon.color}" `);
	const encodedSvg = `data:image/svg+xml;utf8;base64,${Buffer.from(svg).toString('base64')}${encode(` | width=${constants.icon.size} height=${constants.icon.size}`)}`;
	const markdown = new vscode.MarkdownString(`![preview](${encodedSvg})`);
	return new vscode.Hover([markdown, item.name], range);
}

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

				return manifest.map((item: any) => createCompletionItem(item, document.languageId));
			},
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
function createCompletionItem(item: any, languageId: string): vscode.CompletionItem {
	let svgText = item.svg;
	if (['css', 'scss', 'sass', 'less'].includes(languageId)) {
		svgText = `url("data:image/svg+xml;utf8,${encodeURIComponent(svgText)}")`;
	}

	// Create an additionalTextEdit that replaces the icon- prefix with an empty string
	const additionalTextEdit = new vscode.TextEdit(
		new vscode.Range(
			new vscode.Position(0, 0), // You might need to adjust the position based on actual use-case
			new vscode.Position(0, Math.max('icon-'.length, 0)), // Assuming 'icon-' is at the start of the line
		),
		'',
	);

	return {
		additionalTextEdits: [additionalTextEdit],
		detail: item.name,
		documentation: createPreviewSvg(item),
		insertText: svgText,
		kind: vscode.CompletionItemKind.Snippet,
		label: `icon-${item.name}`,
		sortText: item.name,
	};
}

/**
 * Extracted method to create a MarkdownString with a preview of the SVG icon
 *
 * @param object item
 * @return vscode.MarkdownString
 */
function createPreviewSvg(item: any): vscode.MarkdownString {
	const svg = item.svg.replace(/fill="[^\"]+"/gi, '').replace(/<svg/gi, `<svg fill="${constants.icon.color}" `);
	const encodedSvg = `data:image/svg+xml;utf8;base64,${Buffer.from(svg).toString('base64')}${encode(` | width=${constants.icon.size} height=${constants.icon.size}`)}`;
	return new vscode.MarkdownString(`![preview](${encodedSvg})`);
}
