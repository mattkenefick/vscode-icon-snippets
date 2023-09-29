import * as vscode from 'vscode';

// Get settings
const settings = vscode.workspace.getConfiguration('icon-snippets');

export default {
	icon: {
		color: '#cccccc',
		size: 100,
	},
	selectors: ['css', 'dhtml', 'edge', 'html', 'javascript', 'javascriptreact', 'markdown', 'ng-template', 'php', 'plaintext', 'scss', 'twig', 'typescript', 'typescriptreact', 'vue', 'vue-html', 'xml'],
};
