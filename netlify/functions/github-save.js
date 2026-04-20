// Netlify Function — Proxy vers GitHub API
// Vérifie l'auth Netlify Identity puis commit dans le repo GitHub

const REPO = process.env.GITHUB_REPO || 'Reyannetest/perle-de-fes';
const BRANCH = process.env.GITHUB_BRANCH || 'main';

// Whitelist des chemins autorisés pour la sécurité (path traversal protection)
const ALLOWED_PATHS = [
    'data/site-content.json',
    'data/site-design.json',
    'data/products.json'
];
const ALLOWED_PATH_PREFIXES = [
    'images/',
    'data/'
];

function isPathAllowed(path) {
    // Normaliser le chemin et vérifier les tentatives de traversal
    const normalizedPath = path.replace(/\\/g, '/').replace(/^\/+/, '');

    // Bloquer les tentatives de path traversal
    if (normalizedPath.includes('..') || normalizedPath.includes('//')) {
        return false;
    }

    // Vérifier si le chemin est dans la whitelist exacte
    if (ALLOWED_PATHS.includes(normalizedPath)) {
        return true;
    }

    // Vérifier si le chemin commence par un préfixe autorisé
    return ALLOWED_PATH_PREFIXES.some(prefix => normalizedPath.startsWith(prefix));
}

exports.handler = async function (event, context) {
    // Vérifier l'authentification
    const { identity, user } = context.clientContext || {};
    if (!user) {
        return { statusCode: 401, body: JSON.stringify({ error: 'Non authentifié' }) };
    }

    // Vérifier la méthode
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: JSON.stringify({ error: 'Méthode non autorisée' }) };
    }

    // Récupérer le token GitHub depuis les variables d'environnement
    const githubToken = process.env.GITHUB_TOKEN;
    if (!githubToken) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'GITHUB_TOKEN non configuré dans les variables d\'environnement Netlify.' })
        };
    }

    let body;
    try {
        body = JSON.parse(event.body);
    } catch (e) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Body invalide' }) };
    }

    const { action } = body;

    // Vérifier que le chemin est autorisé (protection path traversal)
    if (body.path && !isPathAllowed(body.path)) {
        return {
            statusCode: 403,
            body: JSON.stringify({ error: 'Chemin non autorisé: ' + body.path })
        };
    }

    try {
        if (action === 'save') {
            const result = await saveFile(githubToken, body.path, body.content, body.message);
            return { statusCode: 200, body: JSON.stringify(result) };
        } else if (action === 'upload') {
            const result = await uploadFile(githubToken, body.path, body.base64);
            return { statusCode: 200, body: JSON.stringify(result) };
        } else {
            return { statusCode: 400, body: JSON.stringify({ error: 'Action inconnue: ' + action }) };
        }
    } catch (err) {
        console.error('Erreur:', err);
        return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
    }
};

async function githubAPI(token, endpoint, options = {}) {
    const res = await fetch(`https://api.github.com/repos/${REPO}${endpoint}`, {
        ...options,
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.github+json',
            'Content-Type': 'application/json',
            'X-GitHub-Api-Version': '2022-11-28',
            ...(options.headers || {})
        }
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`GitHub API ${res.status}: ${text.substring(0, 300)}`);
    }
    return res.json();
}

async function saveFile(token, path, content, message) {
    // Encoder le contenu en base64 (UTF-8)
    const contentBase64 = Buffer.from(content, 'utf-8').toString('base64');

    // Créer le blob
    const blob = await githubAPI(token, '/git/blobs', {
        method: 'POST',
        body: JSON.stringify({ content: contentBase64, encoding: 'base64' })
    });

    // Commit via tree
    return await commitBlob(token, path, blob.sha, message || 'Mise à jour ' + path.split('/').pop() + ' via admin');
}

async function uploadFile(token, path, base64Data) {
    // Créer le blob (déjà en base64)
    const blob = await githubAPI(token, '/git/blobs', {
        method: 'POST',
        body: JSON.stringify({ content: base64Data, encoding: 'base64' })
    });

    await commitBlob(token, path, blob.sha, 'Upload ' + path.split('/').pop() + ' via admin');
    return { path: '/' + path };
}

async function commitBlob(token, filePath, blobSha, message) {
    // Récupérer la ref actuelle
    const ref = await githubAPI(token, `/git/refs/heads/${BRANCH}`);
    const commitSha = ref.object.sha;

    // Récupérer le tree du commit
    const commit = await githubAPI(token, `/git/commits/${commitSha}`);

    // Créer un nouveau tree
    const newTree = await githubAPI(token, '/git/trees', {
        method: 'POST',
        body: JSON.stringify({
            base_tree: commit.tree.sha,
            tree: [{ path: filePath, mode: '100644', type: 'blob', sha: blobSha }]
        })
    });

    // Créer le commit
    const newCommit = await githubAPI(token, '/git/commits', {
        method: 'POST',
        body: JSON.stringify({
            message,
            tree: newTree.sha,
            parents: [commitSha]
        })
    });

    // Mettre à jour la branche
    await githubAPI(token, `/git/refs/heads/${BRANCH}`, {
        method: 'PATCH',
        body: JSON.stringify({ sha: newCommit.sha })
    });

    return { sha: newCommit.sha, message };
}
