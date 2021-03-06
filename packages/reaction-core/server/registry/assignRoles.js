/**
 * getRouteName
 * assemble route name to be standard
 * this is duplicate that exists in ReactionRouter
 * however this is to avoid a dependency in core
 * on the router
 * prefix/package name + registry name or route
 * @param  {[type]} packageName  [package name]
 * @param  {[type]} registryItem [registry object]
 * @return {String}              [route name]
 */
const getRouteName = (packageName, registryItem) => {
  let routeName;
  if (packageName && registryItem) {
    if (registryItem.name) {
      routeName = registryItem.name;
    } else if (registryItem.template) {
      routeName = `${packageName}/${registryItem.template}`;
    } else {
      routeName = `${packageName}`;
    }
    // dont include params in the name
    routeName = routeName.split(":")[0];
    return routeName;
  }
};

/**
 * ReactionRegistry.assignOwnerRoles
 * populate roles with all the packages and their permissions
 * this is the main way that roles are inserted and created for
 * admin user.
 * we assign all package roles to each owner account for each shopId
 * we assign only basic GLOBAL_GROUP rights
 *
 * @param  {String} shopId - shopId
 * @param  {String} pkgName - Package name
 * @param  {String} registry - registry object
 * @return {undefined}
 */

ReactionRegistry.assignOwnerRoles = (shopId, pkgName, registry) => {
  const defaultRoles = ["owner", "admin", "guest"];
  let packageRoles = defaultRoles.slice();
  packageRoles.push(pkgName);
  let globalRoles = packageRoles.slice();

  if (registry) {
      // for each registry item define and push roles
    for (let registryItem of registry) {
      // packages don't need to define specific permission routes.,
      // the routeName will be used as default roleName for each route.
      // todo: check dependency on this.
      const roleName = getRouteName(pkgName, registryItem);
      if (roleName) {
        packageRoles.push(roleName);
      }

      // Get all defined permissions, add them to an array
      // define permissions if you need to check custom permission
      if (registryItem.permissions) {
        for (let permission of registryItem.permissions) {
          packageRoles.push(permission.permission);
        }
      }
    }
  } else {
    ReactionCore.Log.debug(`No routes loaded for ${pkgName}`);
  }
  // only unique roles
  packageRoles = _.uniq(packageRoles);
  // globalRoles = _.uniq(globalRoles);
  const defaultOwnerRoles = ["owner"];
  // get existing shop owners to add new roles to
  const owners = [];
  const shopOwners = Roles.getUsersInRole(defaultOwnerRoles).fetch();
  // just a nice warning. something is misconfigured.
  if (!shopOwners) {
    ReactionCore.Log.warn("Cannot assign roles without existing owner users.");
    return;
  }
  // assign this package permission to each existing owner.
  for (let account of shopOwners) {
    owners.push(account._id);
  }
  // we don't use accounts/addUserPermissions here because we may not yet have permissions
  Roles.addUsersToRoles(owners, packageRoles, shopId);

  // the reaction owner has permissions to all sites by default
  Roles.addUsersToRoles(owners, globalRoles, Roles.GLOBAL_GROUP);

  ReactionCore.Log.debug(`Owner permissions added for ${pkgName}`);
};
