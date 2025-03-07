import dotenv from 'dotenv';
import express from 'express';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI =
	process.env.MONGO_URI || 'mongodb://localhost:27017/imageboard';

const server = http.createServer(app);

const io = new Server(server, {
	cors: {
		origin: 'http://localhost:5173',
		methods: ['GET', 'POST'],
	},
});

app.use(cors());
app.use(bodyParser.json());

mongoose.connect(MONGO_URI);
const db = mongoose.connection;

db.on('error', console.error.bind(console, '❌ MongoDB connection error:'));
db.once('open', () => console.log('✅ Connected to MongoDB'));

// Schemas and Models
const boardSchema = new mongoose.Schema({
	name: { type: String, required: true, unique: true },
	description: String,
	createdAt: { type: Date, default: Date.now },
});

const threadSchema = new mongoose.Schema({
	boardId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Board',
		required: true,
	},
	title: { type: String, required: true },
	createdAt: { type: Date, default: Date.now },
});

const messageSchema = new mongoose.Schema({
	threadId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Thread',
		required: true,
	},
	content: { type: String, required: true },
	createdAt: { type: Date, default: Date.now },
});

const Board = mongoose.model('Board', boardSchema);
const Thread = mongoose.model('Thread', threadSchema);
const Message = mongoose.model('Message', messageSchema);

// Middleware for admin authentication (example)
const isAdmin = (req, res, next) => {
	const adminKey = req.headers['admin-key'];

	if (!process.env.ADMIN_KEY) {
		return res
			.status(500)
			.json({ error: 'Server is not configured properly: missing ADMIN_KEY' });
	}

	if (adminKey === process.env.ADMIN_KEY) {
		next();
	} else {
		res.status(403).json({ error: 'Forbidden: Admin access only' });
	}
};

const formatDate = date => {
	return new Intl.DateTimeFormat('ru-RU', {
		day: '2-digit',
		month: '2-digit',
		year: 'numeric',
	}).format(new Date(date));
};

io.on('connection', socket => {
	console.log('🔵 User connected:', socket.id);

	socket.on('newMessage', async data => {
		const { threadId, content } = data;
		const message = new Message({ threadId, content });
		await message.save();
		const formattedMessage = {
			...message.toObject(),
			formattedDate: formatDate(message.createdAt),
		};

		io.emit('messageReceived', formattedMessage);
	});

	socket.on('disconnect', () => {
		console.log('🔴 User disconnected:', socket.id);
	});
});

app.post('/boards', isAdmin, async (req, res) => {
	try {
		const { name, description } = req.body;
		const board = new Board({ name, description });
		await board.save();
		res.status(201).json(board);
	} catch (err) {
		res.status(400).json({ error: err.message });
	}
});

app.get('/boards', async (req, res) => {
	try {
		const boards = await Board.find();
		const formattedBoards = boards.map(board => ({
			...board.toObject(),
			formattedDate: formatDate(board.createdAt), // Форматируем дату для доски
		}));
		res.json(formattedBoards);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

app.post('/boards/:boardId/threads', async (req, res) => {
	try {
		const { boardId } = req.params;
		const { title } = req.body;
		const thread = new Thread({ boardId, title });
		await thread.save();
		res.status(201).json(thread);
	} catch (err) {
		res.status(400).json({ error: err.message });
	}
});

app.get('/boards/:boardId/threads', async (req, res) => {
	try {
		const { boardId } = req.params;
		const threads = await Thread.find({ boardId });
		const formattedThreads = threads.map(thread => ({
			...thread.toObject(),
			formattedDate: formatDate(thread.createdAt), // Форматируем дату для темы
		}));
		res.json(formattedThreads);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

app.post('/threads/:threadId/messages', async (req, res) => {
	try {
		const { threadId } = req.params;
		const { content } = req.body;
		const message = new Message({ threadId, content });
		await message.save();
		res.status(201).json(message);
	} catch (err) {
		res.status(400).json({ error: err.message });
	}
});

app.get('/threads/:threadId/messages', async (req, res) => {
	try {
		const { threadId } = req.params;
		const messages = await Message.find({ threadId });
		const formattedMessages = messages.map(message => ({
			...message.toObject(),
			formattedDate: formatDate(message.createdAt),
		}));
		res.json(formattedMessages);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

server.listen(PORT, () => {
	console.log(`🚀 Server running on http://localhost:${PORT}`);
});
