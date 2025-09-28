// utils/yetkiKontrol.js
import config from '../config.js'; // config objesinin tamamını import et

export function isAuthorized(member, requiredRoleId) {
    if (!member || !requiredRoleId) {
        return false;
    }

    const hasRequiredRole = member.roles.cache.has(requiredRoleId);
    const isAdmin = member.roles.cache.has(config.adminRoleId); // config objesinden adminRoleId'yi alıyoruz

    return hasRequiredRole || isAdmin;
}