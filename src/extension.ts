import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import constants from './constants';
import encode from './functions/encode';
import VsCodeHelper from './utility/vscode-helper';

/**
 * @author Matt Kenefick <polymermallard.com>
 * @param ExtensionContract context
 * @return void
 */
export async function activate(context: vscode.ExtensionContext) {
	const manifest = await new Promise((resolve, reject) => {
		fs.readFile(path.resolve(__dirname, '../assets/manifest.json'), (err, data) => {
			if (err) {
				reject(err);
				return;
			}

			return resolve(JSON.parse(data.toString('utf8')));
		});
	});

	context.subscriptions.push(completionProvider(manifest), hoverProvider(manifest));
}

// this method is called when your extension is deactivated
export function deactivate() {}

/**
 * @param IManifest manifest
 * @return
 */
function hoverProvider(manifest: any = []) {
	const options: any = {};

	/**
	 * @param vscode.TextDocument document
	 * @param vscode.Position position
	 * @return Promise<void>
	 */
	options.provideHover = async function (document: vscode.TextDocument, position: vscode.Position) {
		const regex = /bi-((\w|\-)+)/i;
		const range = document.getWordRangeAtPosition(position, regex);

		if (!range) {
			return null;
		}

		const word = document.getText(range);
		const match = regex.exec(word);

		if (!match) {
			return null;
		}
		const iconName = match[1];

		for (const item of manifest) {
			if (iconName == item.name) {
				const svg = item.svg.replace(/<path/gi, `<path fill="${constants.icon.color}" `);
				const previewSvg = 'data:image/svg+xml;utf8;base64,' + Buffer.from(svg).toString('base64') + encode(` | width=${constants.icon.size} height=${constants.icon.size}`);
				const icon = new vscode.MarkdownString(`![preview](${previewSvg})`);
				const hover: vscode.Hover = {
					contents: [icon, item.name],
					range: range,
				};

				return hover;
			}
		}
	};

	return vscode.languages.registerHoverProvider(constants.selectors, options);
}

/**
 * @param IManifest manifest
 * @return
 */
function completionProvider(manifest: any = []) {
	const trigger: string = '-';
	const options: any = {};

	options.provideCompletionItems = async function (document: vscode.TextDocument, position: vscode.Position) {
		const languageId = document.languageId;
		const linePrefix = document.lineAt(position).text.substr(0, position.character);
		const match = linePrefix.match(/icon(-)?/);

		if (!match) {
			return [];
		}

		return [...manifest].map((manifestItem): vscode.CompletionItem & any => {
			let text: string = manifestItem.svg;

			// Get language type
			if (languageId === 'css' || languageId === 'scss' || languageId === 'sass' || languageId === 'less') {
				text = `url("data:image/svg+xml;utf8,${encodeURIComponent(text)}")`;
			}

			return {
				// additionalTextEdits: [vscode.TextEdit.delete(new vscode.Range(position.line, position.character - match[0].length, position.line, position.character))],
				insertText: text,
				kind: vscode.CompletionItemKind.Snippet,
				label: `icon-${manifestItem.name}`,
				meta: manifestItem,
				sortText: manifestItem.name,
			};
		});
	};

	options.resolveCompletionItem = function (item: vscode.CompletionItem & any, token: vscode.CancellationToken): vscode.ProviderResult<vscode.CompletionItem> {
		const regex = /<svg(.*?)<\/svg>/gm;
		let utf8String = item.meta.svg
			.toString('utf8')
			.replace(/fill="[^\"]+"/gi, '')
			.replace(/<svg/gi, `<svg fill="${constants.icon.color}" `);

		const previewSvg = 'data:image/svg+xml;utf8;base64,' + Buffer.from(utf8String).toString('base64') + encode(` | width=${constants.icon.size} height=${constants.icon.size}`);

		return {
			detail: item.meta.name,
			documentation: new vscode.MarkdownString(`![preview](${previewSvg})`),
			...item,
		};
	};

	return vscode.languages.registerCompletionItemProvider(constants.selectors, options, trigger);
}
