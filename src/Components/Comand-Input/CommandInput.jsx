import React from 'react';

export default function ComandInput({ command, setCommand, handleCommand }) {
	return (
		<div className='input-area'>
			<span className='prompt'> &gt; </span>
			<input
				type='text'
				className='command-input'
				value={command}
				onChange={e => setCommand(e.target.value)}
				onKeyDown={e => e.key === 'Enter' && handleCommand(command)}
				autoFocus
			/>
		</div>
	);
}
