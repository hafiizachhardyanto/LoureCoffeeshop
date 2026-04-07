const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

interface FirestoreDocument {
  name: string;
  fields: Record<string, any>;
  createTime?: string;
  updateTime?: string;
}

function convertToFirestoreValue(value: any): any {
  if (value === null || value === undefined) {
    return { nullValue: null };
  }
  if (typeof value === 'string') {
    return { stringValue: value };
  }
  if (typeof value === 'number') {
    if (Number.isInteger(value)) {
      return { integerValue: String(value) };
    }
    return { doubleValue: value };
  }
  if (typeof value === 'boolean') {
    return { booleanValue: value };
  }
  if (Array.isArray(value)) {
    return {
      arrayValue: {
        values: value.map(item => convertToFirestoreValue(item))
      }
    };
  }
  if (typeof value === 'object') {
    const fields: Record<string, any> = {};
    Object.keys(value).forEach(key => {
      fields[key] = convertToFirestoreValue(value[key]);
    });
    return { mapValue: { fields } };
  }
  return { stringValue: String(value) };
}

function convertFromFirestoreValue(field: any): any {
  if (!field) return null;
  if (field.stringValue !== undefined) return field.stringValue;
  if (field.integerValue !== undefined) return parseInt(field.integerValue);
  if (field.doubleValue !== undefined) return field.doubleValue;
  if (field.booleanValue !== undefined) return field.booleanValue;
  if (field.nullValue !== undefined) return null;
  if (field.arrayValue?.values) {
    return field.arrayValue.values.map((v: any) => convertFromFirestoreValue(v));
  }
  if (field.mapValue?.fields) {
    const result: Record<string, any> = {};
    Object.keys(field.mapValue.fields).forEach(key => {
      result[key] = convertFromFirestoreValue(field.mapValue.fields[key]);
    });
    return result;
  }
  if (field.timestampValue) return field.timestampValue;
  return null;
}

function documentToJson(doc: FirestoreDocument): Record<string, any> {
  const result: Record<string, any> = {
    id: doc.name.split('/').pop() || '',
  };
  if (doc.fields) {
    Object.keys(doc.fields).forEach(key => {
      result[key] = convertFromFirestoreValue(doc.fields[key]);
    });
  }
  return result;
}

export async function queryFirestore(
  collection: string, 
  field?: string, 
  op?: string, 
  value?: string
): Promise<any[]> {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents:runQuery?key=${API_KEY}`;
  
  const body: any = {
    structuredQuery: {
      from: [{ collectionId: collection }],
    }
  };

  if (field && op && value !== undefined) {
    body.structuredQuery.where = {
      fieldFilter: {
        field: { fieldPath: field },
        op: op === "==" ? "EQUAL" : op,
        value: { stringValue: value }
      }
    };
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Firestore query failed: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  
  if (!Array.isArray(result)) return [];
  
  return result
    .filter((doc: any) => doc.document)
    .map((doc: any) => documentToJson(doc.document));
}

export async function getDocument(collection: string, docId: string): Promise<any | null> {
  const encodedId = encodeURIComponent(docId);
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${collection}/${encodedId}?key=${API_KEY}`;
  
  const response = await fetch(url);
  
  if (response.status === 404) return null;
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Firestore get failed: ${response.status} - ${errorText}`);
  }

  const doc = await response.json();
  return documentToJson(doc);
}

export async function setDocument(collection: string, docId: string, data: any): Promise<any> {
  const encodedId = encodeURIComponent(docId);
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${collection}/${encodedId}?key=${API_KEY}`;
  
  const fields: Record<string, any> = {};
  Object.keys(data).forEach(key => {
    fields[key] = convertToFirestoreValue(data[key]);
  });

  const response = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Firestore set failed: ${response.status} - ${errorText}`);
  }

  return response.json();
}

export async function updateDocument(collection: string, docId: string, data: any): Promise<any> {
  const encodedId = encodeURIComponent(docId);
  const fieldPaths = Object.keys(data).map(k => `updateMask.fieldPaths=${encodeURIComponent(k)}`).join('&');
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${collection}/${encodedId}?${fieldPaths}&key=${API_KEY}`;
  
  const fields: Record<string, any> = {};
  Object.keys(data).forEach(key => {
    fields[key] = convertToFirestoreValue(data[key]);
  });

  const response = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Firestore update failed: ${response.status} - ${errorText}`);
  }

  return response.json();
}

export async function deleteDocument(collection: string, docId: string): Promise<boolean> {
  const encodedId = encodeURIComponent(docId);
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${collection}/${encodedId}?key=${API_KEY}`;
  
  const response = await fetch(url, {
    method: 'DELETE',
  });

  return response.ok;
}