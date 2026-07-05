import type { FileSystemHandle as BrowserFileSystemHandle } from 'browser-fs-access';
import {
  fileOpen as _fileOpen,
  fileSave as _fileSave,
  supported as nativeFileSystemSupported,
} from 'browser-fs-access';
import { MIME_TYPES } from '../constants';

type FILE_EXTENSION = Exclude<keyof typeof MIME_TYPES, 'binary'>;

// Handle "falso" que representa um caminho já escolhido no disco (Tauri não tem
// FileSystemFileHandle nativo, então guardamos o path e simulamos o mesmo contrato)
export type TauriFileHandle = { __tauriPath: string };

export type FileSystemHandle =
  | BrowserFileSystemHandle
  | FileSystemFileHandle
  | TauriFileHandle;

const isTauri = (): boolean =>
  typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

const isTauriFileHandle = (
  handle: unknown
): handle is TauriFileHandle =>
  !!handle && typeof handle === 'object' && '__tauriPath' in (handle as any);

const TAURI_LAST_PATH_KEY = 'drawnix-tauri-last-path';

const rememberTauriPath = (path: string) => {
  try {
    localStorage.setItem(TAURI_LAST_PATH_KEY, path);
  } catch {
    // localStorage indisponível, ignora silenciosamente
  }
};

export const getLastTauriPath = (): string | null => {
  try {
    return localStorage.getItem(TAURI_LAST_PATH_KEY);
  } catch {
    return null;
  }
};

export const fileOpen = <M extends boolean | undefined = false>(opts: {
  extensions?: FILE_EXTENSION[];
  description: string;
  multiple?: M;
}): Promise<M extends false | undefined ? File : File[]> => {
  type RetType = M extends false | undefined ? File : File[];

  const mimeTypes = opts.extensions?.reduce((mimeTypes, type) => {
    mimeTypes.push(MIME_TYPES[type]);
    return mimeTypes;
  }, [] as string[]);

  const extensions = opts.extensions?.reduce((acc, ext) => {
    if (ext === 'jpg') {
      return acc.concat('.jpg', '.jpeg');
    }
    return acc.concat(`.${ext}`);
  }, [] as string[]);

  if (isTauri()) {
    return tauriFileOpen(
      { description: opts.description, multiple: opts.multiple ?? false },
      extensions
    ) as Promise<RetType>;
  }

  return _fileOpen({
    description: opts.description,
    extensions,
    mimeTypes,
    multiple: opts.multiple ?? false,
  }) as Promise<RetType>;
};

const tauriFileOpen = async (
  opts: { description: string; multiple: boolean },
  extensions?: string[]
): Promise<File | File[]> => {
  const { open } = await import('@tauri-apps/plugin-dialog');
  const { readFile } = await import('@tauri-apps/plugin-fs');

  const cleanExtensions = (extensions ?? []).map((ext) =>
    ext.replace(/^\./, '')
  );

  const selected = await open({
    multiple: opts.multiple,
    filters: cleanExtensions.length
      ? [{ name: opts.description, extensions: cleanExtensions }]
      : undefined,
  });

  if (!selected) {
    throw new DOMException('The user aborted a request.', 'AbortError');
  }

  const paths = Array.isArray(selected) ? selected : [selected];

  const files = await Promise.all(
    paths.map(async (path) => {
      const bytes = await readFile(path);
      rememberTauriPath(path);
      const name = path.split(/[\\/]/).pop() ?? 'file';
      const file = new File([bytes], name);
      // json.ts lê especificamente `file.handle`, não `file.__tauriPath`
      (file as any).handle = { __tauriPath: path } as TauriFileHandle;
      return file;
    })
  );

  return opts.multiple ? files : files[0];
};

export const fileSave = (
  blob: Blob | Promise<Blob>,
  opts: {
    name: string;
    extension: FILE_EXTENSION;
    description: string;
    fileHandle?: FileSystemHandle | null;
  }
) => {
  if (isTauri()) {
    return tauriFileSave(blob, opts);
  }

  return _fileSave(
    blob,
    {
      fileName: `${opts.name}.${opts.extension}`,
      description: opts.description,
      extensions: [`.${opts.extension}`],
    },
    opts.fileHandle as any
  );
};

const tauriFileSave = async (
  blob: Blob | Promise<Blob>,
  opts: {
    name: string;
    extension: FILE_EXTENSION;
    description: string;
    fileHandle?: FileSystemHandle | null;
  }
): Promise<TauriFileHandle> => {
  const { save } = await import('@tauri-apps/plugin-dialog');
  const { writeFile } = await import('@tauri-apps/plugin-fs');

  let path: string | null = null;

  // se já existe um handle com path salvo, reaproveita sem abrir diálogo
  if (isTauriFileHandle(opts.fileHandle)) {
    path = opts.fileHandle.__tauriPath;
  } else {
    path = await save({
      defaultPath: `${opts.name}.${opts.extension}`,
      filters: [{ name: opts.description, extensions: [opts.extension] }],
    });
  }

  if (!path) {
    throw new DOMException('The user aborted a request.', 'AbortError');
  }

  const resolvedBlob = await blob;
  const arrayBuffer = await resolvedBlob.arrayBuffer();
  await writeFile(path, new Uint8Array(arrayBuffer));

  rememberTauriPath(path);

  return { __tauriPath: path };
};

export { nativeFileSystemSupported };