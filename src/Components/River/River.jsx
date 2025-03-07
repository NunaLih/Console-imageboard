import React from 'react';
import './River.css'; // Создадим новый CSS-файл

export default function River() {
	// Генерируем случайные точки для анимации
	const dots = Array(50)
		.fill()
		.map((_, i) => ({
			id: i,
			left: Math.random() * 100,
			delay: Math.random() * 5,
			duration: 2 + Math.random() * 3,
		}));

	return (
		<div className='river-container'>
			<pre>
				{`     _____    ____  ____      ____      ______        _____   
 ___|\\    \\  |    ||    |    |    | ___|\\     \\   ___|\\    \\  
|    |\\    \\ |    ||    |    |    ||     \\     \\ |    |\\    \\ 
|    | |    ||    ||    |    |    ||     ,_____/||    | |    |
|    |/____/ |    ||    |    |    ||     \\--'\\_|/|    |/____/ 
|    |\\    \\ |    ||    |    |    ||     /___/|  |    |\\    \\ 
|    | |    ||    ||\\    \\  /    /||     \\____|\\ |    | |    |
|____| |____||____|| \\ ___\\/___ / ||____ '     /||____| |____|
|    | |    ||    | \\ |   ||   | / |    /_____/ ||    | |    |
|____| |____||____|  \\|___||___|/  |____|     | /|____| |____|
  \\/     \\/    \\/      \\/    \\/      \\/ |_____|/   \\/     \\/  
   '     '      '       '    '        '    )/       '     ' `}
			</pre>

			<div className='rain-container'>
				{dots.map(dot => (
					<div
						key={dot.id}
						className='rain-drop'
						style={{
							left: `${dot.left}%`,
							animationDelay: `${dot.delay}s`,
							animationDuration: `${dot.duration}s`,
						}}
					/>
				))}
			</div>
		</div>
	);
}
