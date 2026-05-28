import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(__dirname, '../../data');

async function ensureDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (err) {
    if (err.code !== 'EEXIST') throw err;
  }
}

function getFilePath(filename) {
  // Support both filename and filename.json
  const filePath = filename.endsWith('.json') ? filename : `${filename}.json`;
  return path.join(DATA_DIR, filePath);
}

export async function readData(filename) {
  await ensureDataDir();
  const filePath = getFilePath(filename);
  try {
    const raw = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    if (err.code === 'ENOENT') {
      const empty = filename.includes('profile') || filename.includes('settings') ? {} : [];
      await writeData(filename, empty);
      return empty;
    }
    throw new Error(`Error reading ${filePath}: ${err.message}`);
  }
}

export async function writeData(filename, data) {
  await ensureDataDir();
  const filePath = getFilePath(filename);
  try {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    throw new Error(`Error writing ${filePath}: ${err.message}`);
  }
}

export async function findById(filename, id) {
  const data = await readData(filename);
  if (Array.isArray(data)) {
    return data.find(item => item.id === id) || null;
  }
  return data.id === id ? data : null;
}

export async function insertOne(filename, item) {
  const data = await readData(filename);
  const newItem = {
    ...item,
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  if (Array.isArray(data)) {
    data.push(newItem);
    await writeData(filename, data);
  } else {
    await writeData(filename, newItem);
    return newItem;
  }
  return newItem;
}

export async function updateOne(filename, id, updates) {
  const data = await readData(filename);
  if (Array.isArray(data)) {
    const index = data.findIndex(item => item.id === id);
    if (index === -1) return null;
    data[index] = {
      ...data[index],
      ...updates,
      id: data[index].id,
      created_at: data[index].created_at,
      updated_at: new Date().toISOString(),
    };
    await writeData(filename, data);
    return data[index];
  }
  if (data.id === id) {
    const updated = { ...data, ...updates, id: data.id, updated_at: new Date().toISOString() };
    await writeData(filename, updated);
    return updated;
  }
  return null;
}

export async function deleteOne(filename, id) {
  const data = await readData(filename);
  if (Array.isArray(data)) {
    const index = data.findIndex(item => item.id === id);
    if (index === -1) return null;
    const deleted = data.splice(index, 1)[0];
    await writeData(filename, data);
    return deleted;
  }
  return null;
}

export async function queryWhere(filename, predicateFn) {
  const data = await readData(filename);
  if (Array.isArray(data)) {
    return data.filter(predicateFn);
  }
  return predicateFn(data) ? [data] : [];
}

export default {
  readData,
  writeData,
  findById,
  insertOne,
  updateOne,
  deleteOne,
  queryWhere,
};
