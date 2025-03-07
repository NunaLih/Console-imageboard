import React from 'react';
import DOMPurify from 'dompurify';

const formatMessage = text => {
	if (!text) return { __html: '' };

	let formattedText = text
		// Специальные блоки
		.replace(
			/\[spoiler\](.*?)\[\/spoiler\]/gis,
			'<span class="spoiler" onclick="this.classList.toggle(\'revealed\')">$1</span>'
		)
		.replace(
			/%%(.*?)%%/gis,
			'<span class="spoiler" onclick="this.classList.toggle(\'revealed\')">$1</span>'
		)
		.replace(/\[quote\](.*?)\[\/quote\]/gis, '<blockquote>$1</blockquote>')
		.replace(
			/\[youtube\](.*?)\[\/youtube\]/gis,
			'<iframe width="560" height="315" src="https://www.youtube.com/embed/$1" frameborder="0" allowfullscreen></iframe>'
		)

		// Переносы и разделители
		.replace(/\[br\]/gi, '<br/>')

		// Текстовое форматирование
		.replace(/\[b\](.*?)\[\/b\]/gis, '<strong>$1</strong>')
		.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
		.replace(/\[i\](.*?)\[\/i\]/gis, '<em>$1</em>')
		.replace(/\*(.*?)\*/g, '<em>$1</em>')
		.replace(/\[s\](.*?)\[\/s\]/gis, '<s>$1</s>')
		.replace(/\[u\](.*?)\[\/u\]/gis, '<u>$1</u>')

		// Ссылки и медиа
		.replace(/\[img\](.*?)\[\/img\]/gis, '<img src="$1" />')
		.replace(
			/\[url=(.*?)\](.*?)\[\/url\]/gis,
			'<a href="$1" target="_blank">$2</a>'
		)

		// Кастомные стили
		.replace(/\[css=(.*?)\](.*?)\[\/css\]/gis, '<span style="$1">$2</span>');

	const clean = DOMPurify.sanitize(formattedText, {
		ALLOWED_TAGS: [
			'strong',
			'em',
			'u',
			's',
			'img',
			'a',
			'span',
			'blockquote',
			'iframe',
			'br',
		],
		ALLOWED_ATTR: [
			'src',
			'href',
			'target',
			'style',
			'class',
			'onclick',
			'width',
			'height',
			'frameborder',
			'allowfullscreen',
		],
		ALLOWED_URI_REGEXP:
			/^(?:(?:https?|mailto|ftp):|[^a-z]|[a-z+.-]+(?:[^a-z+.-:]|$))/i,
	});

	return { __html: clean };
};

export default formatMessage;
