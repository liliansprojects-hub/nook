const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useEffect, useState } from 'react';

const cache = new Map();

export async function signedUrl(fileUri) {
  if (!fileUri) return null;
  if (cache.has(fileUri)) return cache.get(fileUri);
  const { signed_url } = await db.integrations.Core.CreateFileSignedUrl({ file_uri: fileUri, expires_in: 3600 });
  cache.set(fileUri, signed_url);
  return signed_url;
}

export function useSignedUrl(fileUri) {
  const [url, setUrl] = useState(() => (fileUri ? cache.get(fileUri) || null : null));

  useEffect(() => {
    let live = true;
    if (!fileUri) {
      setUrl(null);
      return () => {
        live = false;
      };
    }
    if (cache.has(fileUri)) {
      setUrl(cache.get(fileUri));
      return () => {
        live = false;
      };
    }
    signedUrl(fileUri)
      .then((u) => live && setUrl(u))
      .catch(() => live && setUrl(null));
    return () => {
      live = false;
    };
  }, [fileUri]);

  return url;
}