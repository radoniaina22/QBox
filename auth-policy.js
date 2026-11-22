// Modèle préparatoire : les autorisations effectives doivent aussi être imposées côté serveur.
const QBoxAuthPolicy = (() => {
    const roles = Object.freeze({
        ADMIN: 'admin',
        PILOT: 'pilot',
        PILOT_RD: 'pilot_rd',
        LOGISTICS: 'logistics',
        UNFPA: 'unfpa',
        // Chef de l'Unité Santé de la Reproduction : lit comme UNFPA, valide les plannings (droit vérifié par le serveur).
        RH_CHIEF: 'rh_chief'
    });

    const sections = Object.freeze([
        'dashboard', 'stocks', 'inventory', 'stock-history', 'quarantine',
        'salama', 'products', 'planning', 'archives', 'drones', 'sorties',
        'history', 'csb', 'ports', 'users'
    ]);

    function roleMatches(role, allowedRoles) {
        return allowedRoles.includes(role) ||
            (role === roles.PILOT_RD && (allowedRoles.includes(roles.PILOT) || allowedRoles.includes(roles.LOGISTICS))) ||
            (role === roles.RH_CHIEF && allowedRoles.includes(roles.UNFPA));
    }

    function canAccess(user, section, action) {
        if (!user || user.status !== 'approved' || !Object.values(roles).includes(user.role) ||
            !sections.includes(section) || !['read', 'write'].includes(action)) return false;
        if (section === 'users') return user.role === roles.ADMIN;
        if (action === 'read') return true;
        if (user.role === roles.ADMIN) return true;
        return (roleMatches(user.role, [roles.PILOT]) && (section === 'drones' || section === 'csb')) ||
            (roleMatches(user.role, [roles.LOGISTICS]) && section !== 'ports' && section !== 'drones');
    }

    return Object.freeze({ roles, sections, roleMatches, canAccess });
})();

if (typeof module !== 'undefined') module.exports = QBoxAuthPolicy;

const QBoxPassword = (() => {
    async function change(config, identity, current, next, stillCurrent) {
        const headers = {apikey:config.key, 'Content-Type':'application/json'};
        const verified = await fetch(`${config.url}/auth/v1/token?grant_type=password`, {
            method:'POST', headers, body:JSON.stringify({email:identity.email, password:current})
        });
        const session = await verified.json().catch(() => null);
        if (!verified.ok) throw new Error(verified.status >= 500
            ? 'Service d’authentification indisponible. Réessayez plus tard.'
            : 'Vérification refusée : vérifiez votre mot de passe actuel.');
        if (!session?.access_token || session.user?.id !== identity.id) throw new Error('Identité de session invalide.');
        if (!stillCurrent()) {
            const logout = await fetch(`${config.url}/auth/v1/logout?scope=local`, {
                method:'POST', headers:{...headers, Authorization:`Bearer ${session.access_token}`}
            });
            if (!logout.ok) throw new Error('La session a changé et la fermeture de la session de vérification a échoué.');
            throw new Error('La session a changé. Reconnectez-vous avant de réessayer.');
        }
        let response;
        try {
            response = await fetch(`${config.url}/auth/v1/user`, {
                method:'PUT', headers:{...headers, Authorization:`Bearer ${session.access_token}`},
                body:JSON.stringify({password:next})
            });
        } catch {
            try {
                const logout = await fetch(`${config.url}/auth/v1/logout?scope=local`, {
                    method:'POST', headers:{...headers, Authorization:`Bearer ${session.access_token}`}
                });
                if (!logout.ok) throw new Error('Déconnexion refusée');
            } catch {
                throw new Error('Résultat incertain et fermeture de la session de vérification non confirmée. Reconnectez-vous pour vérifier le mot de passe.');
            }
            throw new Error('Résultat incertain : vérifiez votre nouveau mot de passe en vous reconnectant.');
        }
        if (!response.ok) {
            const result = await response.json().catch(() => null);
            try {
                const logout = await fetch(`${config.url}/auth/v1/logout?scope=local`, {
                    method:'POST', headers:{...headers, Authorization:`Bearer ${session.access_token}`}
                });
                if (!logout.ok) throw new Error('Déconnexion refusée');
            } catch {
                throw new Error('Modification refusée ; la fermeture de la session de vérification n’a pas pu être confirmée.');
            }
            throw new Error(result?.message || result?.msg || `Modification refusée (${response.status}).`);
        }
        try {
            const logout = await fetch(`${config.url}/auth/v1/logout?scope=global`, {
                method:'POST', headers:{...headers, Authorization:`Bearer ${session.access_token}`}
            });
            if (!logout.ok) throw new Error(`Erreur ${logout.status}`);
            return null;
        } catch {
            return 'Le mot de passe a changé, mais la fermeture des autres sessions n’a pas pu être confirmée. Reconnectez-vous.';
        }
    }
    return Object.freeze({change});
})();
