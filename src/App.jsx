import { useState, useEffect, useRef } from 'react';
import River from './Components/River/River';
import WelcomeMessage from './Components/Welcome-Message/WelcomeMessage';
import CommandInput from './Components/Comand-Input/CommandInput';
import Output from './Components/Output/Output';
import formatMessage from './Components/FormatMessage/FormatMessage';
import axios from 'axios';
import DOMPurify from 'dompurify';
import socket from './socket';
import './App.css';

function App() {
	const [command, setCommand] = useState('');
	const [output, setOutput] = useState([]);
	const [messages, setMessages] = useState([]);
	const [threads, setThreads] = useState([]);
	const [boards, setBoards] = useState([]);
	const [currentView, setCurrentView] = useState('stock');
	const [selectedBoard, setSelectedBoard] = useState([]);
	const [selectedThread, setSelectedThread] = useState([]);
	const chatRef = useRef(null);

	useEffect(() => {
		socket.on('messageReceived', message => {
			setMessages(prev => [
				...prev,
				{
					...message,
					content: message.content,
					formattedDate: new Date(message.createdAt).toLocaleString(),
				},
			]);
		});

		return () => {
			socket.off('messageReceived');
		};
	}, []);

	useEffect(() => {
		chatRef.current?.scrollTo({
			top: chatRef.current.scrollHeight,
			behavior: 'smooth',
		});
	}, [output, messages, threads]);

	useEffect(() => {
		axios.get('http://localhost:3000/boards').then(response => {
			setBoards(response.data);
		});
	}, []);

	useEffect(() => {
		const handleClick = e => {
			if (e.target.classList.contains('spoiler')) {
				e.target.classList.toggle('revealed');
			}
		};

		document.addEventListener('click', handleClick);
		return () => document.removeEventListener('click', handleClick);
	}, []);

	DOMPurify.addHook('uponSanitizeElement', (node, data) => {
		if (data.tagName === 'iframe') {
			const src = node.getAttribute('src') || '';
			if (!src.startsWith('https://www.youtube.com/embed/')) {
				return node.parentNode?.removeChild(node);
			}
		}
	});

	const handleCommand = async () => {
		const trimmedCommand = command.trim('');
		const [action, ...args] = trimmedCommand.split(' ');

		switch (action.toLowerCase()) {
			case 'help': {
				setOutput(prev => [
					...prev,
					'Available  commands and formatting:',
					'Basic  commands:',
					'help       - Show this reference',
					'boards     - List of boards',
					'board   - Select a board',
					'thread  - Select a thread',
					'back       - Go back',
					'',
					'Text  formatting:',
					'**text**  or [b]text[/b]  - Bold',
					'*text*  or [i]text[/i]  - Italics',
					'__text__  or [u]text[/u]  - Underlining',
					'[s]text[/s]  - Strikethrough',
					'[spoiler]text[/spoiler]  or %%text%%  - Spoiler',
					'[quote]text[/quote]  - Quote',
					'[br]  - Line break',
					'[img]URL[/img]  - Image',
					'[url=link]text[/url]  - Hyperlink',
					'[youtube]ID[/youtube]  - YouTube video',
					'[css=style]text[/css]  - Custom css',
				]);
				break;
			}
			case 'boards': {
				setCurrentView('boards');
				break;
			}
			case 'board': {
				const id = args[0];
				if (id && boards[+id - 1]) {
					const boardId = boards[+id - 1]._id;
					axios
						.get(`http://localhost:3000/boards/${boardId}/threads`)
						.then(response => {
							setCurrentView('threads');
							setSelectedBoard(prev => [...prev, boardId]);
							setThreads(response.data);
							setOutput(prev => [
								...prev,
								`you  went to the board ${boards[+id - 1].name}`,
							]);
						});
				} else {
					setOutput(prev => [
						...prev,
						'Incorrect  board number. Enter: board <number>',
					]);
				}
				break;
			}
			case 'thread': {
				const id = args[0];
				if (id && threads[+id - 1]) {
					const threadIds = threads[+id - 1]._id;
					axios
						.get(`http://localhost:3000/threads/${threadIds}/messages`)
						.then(response => {
							setCurrentView('messages');
							setSelectedThread(prev => [...prev, threadIds]);
							setMessages(response.data);
							setOutput(prev => [
								...prev,
								`You  have navigated to the thread: ${threads[+id - 1].title}`,
							]);
						});
					break;
				}

				setCurrentView('threads');
			}
			default: {
				setOutput(prev => [
					...prev,
					`Unknown  command. Enter help for a list of commands.`,
				]);
				break;
			}
			case 'back': {
				if (currentView === 'threads') {
					setCurrentView('boards');
					setOutput(prev => [...prev, 'Youre  back to the list of boards']);
				} else if (currentView === 'messages') {
					setCurrentView('threads');
					setOutput(prev => [...prev, 'Youre  back to the list of posts']);
				} else {
					setOutput(prev => [...prev, 'Youre  already on the home page']);
				}
				break;
			}
			case 'create': {
				const submitThread = args.slice(1).join(' ');
				const submitMessage = args.slice(1).join(' ');
				const boardsIds = selectedBoard[selectedBoard.length - 1];
				const content = args.slice(1).join(' ');

				const threadIds = selectedThread[selectedThread.length - 1];
				const arg = args[0];

				if (arg === 'thread') {
					axios
						.post(`http://localhost:3000/boards/${boardsIds}/threads`, {
							title: submitThread,
						})
						.then(response => {
							socket.emit('newThread', response.data);
						});
				} else if (arg === 'message') {
					axios
						.post(`http://localhost:3000/threads/${threadIds}/messages`, {
							content: submitMessage,
						})
						.then(response => {
							socket.emit('newMessage', {
								...response.data,
								formatMessage: formatMessage(content).__html,
							});
						});
				}
				break;
			}
		}
		setCommand('');
	};

	const renderContent = () => {
		const renderBlock = (content, date, dateClass) => (
			<div className='block-container'>
				<div className='side-lines'></div>
				{content}
				<span className={dateClass}>{date}</span>
			</div>
		);

		if (currentView === 'boards') {
			return boards.map((item, index) => (
				<div key={item._id}>
					[{index + 1}]. {item.name} |{' '}
					<span className='board-name'>{item.description}</span>
				</div>
			));
		} else if (currentView === 'threads') {
			return threads.map((item, index) => (
				<div key={item._id}>
					[{index + 1}]. {item.title} |{' '}
					<span className='date-threads'>{item.formattedDate}</span>
				</div>
			));
		} else if (currentView === 'messages') {
			return messages.map((item, index) => (
				<div key={item._id}>
					{renderBlock(
						<div>
							[{index + 1}].{' '}
							<span dangerouslySetInnerHTML={formatMessage(item.content)} />
						</div>,
						item.formattedDate,
						'date-mess'
					)}
				</div>
			));
		}
	};

	return (
		<div className='terminal'>
			<div className='output' ref={chatRef}>
				<River />
				<WelcomeMessage />
				<Output output={output} />
				{renderContent()}
			</div>
			<CommandInput
				command={command}
				setCommand={setCommand}
				handleCommand={handleCommand}
			/>
		</div>
	);
}

export default App;
