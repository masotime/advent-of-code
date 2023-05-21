import input from './input';

type Path = Array<string>;
type Entry = { type: 'file', size: number } | { type: 'directory', content: Folder };
type Folder = {
    name: string,
    contents: {
        [name: string]: Entry
    },
    size?: number
};
type Context = {
    cwd: Path,
    root: Folder
};
type CommandType = 'ls' | 'cd';

function processCd({ cdLocation, context }: { cdLocation: string, context: Context }): Path {
    const cwd = context.cwd;

    switch (cdLocation) {
        case '/':
            cwd.length = 0;
            break;
        case '..':
            cwd.pop();
            break;
        default:
            cwd.push(cdLocation); 
    }

    return cwd;
}

function navigateToPath({ root, cwd }: Context): Folder {
    let currentFolder: Folder = root;
    let currentFolderPath = '/';
    for (const folder of cwd) {
        const nextNavEntry = currentFolder.contents[folder];
        if (nextNavEntry.type === 'directory') {
            currentFolder = nextNavEntry.content;
            currentFolderPath += `${folder}/`;
        } else {
            throw new Error(`Invalid path /${cwd.join('/')}, could not navigate to ${folder} while in ${currentFolderPath}`);
        }
    }

    return currentFolder;
}

function processLs({ output, context } : { output: Array<string>, context: Context }): Folder {
    const cwdFolder = navigateToPath(context);
    for (const line of output) {
        const [typeOrLength, name] = line.split(' ') as [string, string];
        if (typeOrLength === 'dir') {
            cwdFolder.contents[name] = { type: 'directory', content: { name, contents: {} }};
        } else {
            const size = parseInt(typeOrLength, 10);
            cwdFolder.contents[name] = { type: 'file', size };
        };
    }

    return cwdFolder;
}

function setSizes(folder: Folder): number {
    const entryNames = Object.keys(folder.contents);
    let folderSize = 0;
    for (const name of entryNames) {
        const entry = folder.contents[name];
        if (entry.type === 'file') {
            folderSize += entry.size;
        } else {
            // must be directory
            folderSize += setSizes(entry.content);
        }
    }

    folder.size = folderSize;

    return folderSize;
}

function getFolderSizesAtLeast(root: Folder, limit: number) {    
    const folders: Array<Folder> = [];
    const folderSize = root.size || 0;
    if (folderSize >= limit) {
        folders.push(root);
    }

    for (const entry of Object.values(root.contents)) {
        if (entry.type === 'directory') {
            const subFolders = getFolderSizesAtLeast(entry.content, limit);
            folders.push(...subFolders);
        }
    }

    return folders;
}

export default function() {
    const context = {
        cwd: [],
        root: {
            name: '/',
            contents: {},
            size: 0
        }
    };

    const consoleOutput = input.split('\n');
    let consoleLine = 0;
    let output: Array<string> = [];
    let lastCommand: CommandType | void = undefined;

    while (consoleLine < consoleOutput.length) {
        const currentLine = consoleOutput[consoleLine];
        if (currentLine.startsWith('$')) {
            if (lastCommand === 'ls') {
                // end of output from ls command
                processLs({ output, context });
                output = [];
            }

            const [type, maybeArg] = currentLine.slice(2).split(' ') as [CommandType, string];
            lastCommand = type;

            if (type === 'cd') {
                processCd({ cdLocation: maybeArg, context });
            }
        } else {
            output.push(currentLine);
        }
        consoleLine += 1;
    }

    // do any final processing
    if (lastCommand === 'ls') {
        // end of output from ls command
        processLs({ output, context });
        output = [];
    }

    // compute sizes
    setSizes(context.root);

    const TOTAL_SPACE = 70000000;
    const REQUIRED_SPACE = 30000000;
    const availableSpace = TOTAL_SPACE - context.root.size;
    const minimumToDelete = REQUIRED_SPACE - availableSpace;

    const eligibleFolders = getFolderSizesAtLeast(context.root, minimumToDelete);
    eligibleFolders.sort((a,b) => (a.size || 0) - (b.size || 0));

    return { availableSpace, minimumToDelete, eligibleFolders };
}