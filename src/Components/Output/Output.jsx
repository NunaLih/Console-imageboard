import React from 'react';

export default function Output({ output }) {
	return (
		<>
			{output.map((text, index) => {
				const words = text.split(' ');
				const firstWords = words[0];
				const restOfWords = words.slice(1).join(' ');

				return (
					<div key={index}>
						<span className='color-riv'>&nbsp;{firstWords}&nbsp;</span>
						{restOfWords}
					</div>
				);
			})}
		</>
	);
}
