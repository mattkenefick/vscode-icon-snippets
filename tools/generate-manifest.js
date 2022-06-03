const fs = require('fs');
const path = require('path');

const manifest = [];
const folders = fs.readdirSync(path.join(__dirname, '../assets/icons'));

// Iterate folders
folders.forEach(folder => {
	if (folder[0] === '.') {
		return;
	}

	const items = fs.readdirSync(path.join(__dirname, `../assets/icons/${folder}`));

	// Iterate icons
	items.forEach(icon => {
		if (icon[0] === '.') {
			return;
		}

		const name = icon.split('.svg')[0] + ` (${folder})`;
		const regex = /<svg(.*?)<\/svg>/gm;
		const tags = name.split(/[ -_/]/).filter(x => x != '' && x.length > 1);
		let svg = fs.readFileSync(path.join(__dirname, `../assets/icons/${folder}/${icon}`), 'utf-8');
		let matches;

		svg = svg.replace(/fill="[^\"]+"/gi, '');
		svg = svg.replace(/fill: ?[^;]+;/gi, '');
		svg = svg.replace(/<svg/gi, `<svg fill="currentColor" `);
		svg = svg.replace(/\s+/g, ' ');

		matches = regex.exec(svg);
		svg = matches && matches.length ? matches[0] : svg;

		// Add folder to tags
		tags.push(folder);

		// Add to list
		manifest.push({
			name,
			svg,
			tags,
		});
	});
});

fs.writeFileSync(path.join(__dirname, '../assets/manifest.json'), JSON.stringify(manifest));
