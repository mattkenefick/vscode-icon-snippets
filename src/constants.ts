import * as vscode from 'vscode';

// Get settings
const settings = vscode.workspace.getConfiguration('icon-snippets');

export default {
	icon: {
		color: '#cccccc',
		size: 100,
	},
	selectors: [
		'dhtml',
		'edge',
		'html',
		'javascript',
		'javascriptreact',
		'markdown',
		'ng-template',
		'php',
		'typescript',
		'typescriptreact',
		'twig',
		'vue-html',
		'vue',
		'xml',
	],
};
