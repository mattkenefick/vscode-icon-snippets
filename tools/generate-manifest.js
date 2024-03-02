const fs = require('fs');
const path = require('path');

/**
 * @param string directoryPath
 * @returns string[]
 */
function readDirectorySync(directoryPath) {
	return fs.readdirSync(directoryPath);
}

/**
 * @param string filePath
 * @returns string
 */
function readFileContent(filePath) {
	return fs.readFileSync(filePath, 'utf-8');
}

/**
 * @param string filePath
 * @param object content
 * @returns void
 */
function writeManifestFile(filePath, content) {
	fs.writeFileSync(filePath, JSON.stringify(content, null, 2)); // Pretty print the JSON
}

/**
 * @param string svg
 * @returns string
 */
function cleanSvgContent(svg) {
	svg = svg.replace(/fill="[^\"]+"/gi, '');
	svg = svg.replace(/fill: ?[^;]+;/gi, '');
	svg = svg.replace(/<svg/gi, `<svg fill="currentColor" `);
	svg = svg.replace(/id="[^\"]+"/gi, '');
	svg = svg.replace(/version="[^\"]+"/gi, '');
	svg = svg.replace(/style="[^\"]+"/gi, '');
	svg = svg.replace(/xmlns:xlink="[^\"]+"/gi, '');
	svg = svg.replace(/xml:space="[^\"]+"/gi, '');
	svg = svg.replace(/enable-background="[^\"]+"/gi, '');
	svg = svg.replace(/\s+/gi, ' ');
	svg = svg.replace(/> </gi, '><');
	svg = svg.replace(/"  ([^\s])/gi, '" $1');
	svg = svg.replace(/ x="0px"/gi, '');
	svg = svg.replace(/ y="0px"/gi, '');

	// Remove width inside of svg tag
	svg = svg.replace(/<svg[^>]+>/gi, (match) => {
		return match.replace(/width="[^\"]+"/gi, '');
	});

	// Remove height inside of svg tag
	svg = svg.replace(/<svg[^>]+>/gi, (match) => {
		return match.replace(/height="[^\"]+"/gi, '');
	});

	// Add new width and height
	svg = svg.replace(/<svg/gi, (match) => {
		return match.replace(/<svg/gi, '<svg width="24" height="24"');
	});

	return svg;
}

/**
 * @param string svg
 * @returns string
 */
function extractSvg(svg) {
	const regex = /<svg(.*?)<\/svg>/gm;
	const matches = regex.exec(svg);
	return matches && matches.length ? matches[0] : svg;
}

/**
 * @returns void
 */
function generateManifest() {
	const manifest = [];
	const foldersPath = path.join(__dirname, '../assets/icons');
	const folders = readDirectorySync(foldersPath);

	folders.forEach((folder) => {
		if (folder.startsWith('.')) return;

		const iconsPath = path.join(foldersPath, folder);
		const icons = readDirectorySync(iconsPath);

		icons.forEach((icon) => {
			if (icon.startsWith('.')) return;

			const iconName = icon.split('.svg')[0] + ` (${folder})`;
			const tags = iconName.split(/[ -_/]/).filter((x) => x !== '' && x.length > 1);
			let svgContent = readFileContent(path.join(iconsPath, icon));
			svgContent = cleanSvgContent(svgContent);
			svgContent = extractSvg(svgContent);

			// Add folder to tags
			tags.push(folder);

			// Add to manifest
			manifest.push({
				name: iconName,
				svg: svgContent,
				tags,
			});
		});
	});

	writeManifestFile(path.join(__dirname, '../assets/manifest.json'), manifest);
}

generateManifest();
