/**
 * @param string content
 * @return string
 */
export default function encodeSpaces(content: string) {
	return content.replace(/ /g, '%20');
}
