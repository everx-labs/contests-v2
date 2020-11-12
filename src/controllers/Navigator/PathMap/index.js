import TONLabsRoutes from '../Routes';

export default class PathMap {
    // Initially all controllers MUST have `name` parameter.
    // If a controller has only `name` parameter, it's considered to be one of the root controllers
    // There is only one root controller for each name!!!
    // An exeption is the `master` which is shown along with another root controller in split view!
    // All the rest controllers MUST have more parameters, whether static or dynamic, or even both
    // For each screen static and dynamic parameters MUST differ !!!
    static initialPaths() {
        return {
            ...TONLabsRoutes.routing.paths,
        };
    }

    static errorScreen() {
        return TONLabsRoutes.errorScreen();
    }

    static defaultScreen() {
        return TONLabsRoutes.defaultScreen();
    }

    // Sections
    static sections() {
        return {
            // CV: this.sectionParameter('cv'),
        };
    }

    static sectionParameter(section) {
        return { section };
    }

    // Handling
    static handlePathNavigation(pathName, pathParameters, callback) {
        let routeName = null;
        let params = null;
        let rootController = null;

        const initialPaths = this.initialPaths();
        const screens = Object.keys(initialPaths);
        for (let i = 0; i < screens.length; i += 1) {
            const screen = screens[i];
            const path = initialPaths[screen];

            if (path.name === pathName) {
                if (!path.staticParameters && !path.dynamicParameters
                    && (!path.master)) {
                    // If no parameters were passed in the path, then path is the root
                    if (!pathParameters) {
                        routeName = screen;
                        // rootController = screen as well, but there is no reason to handle it
                        break;
                    }
                    rootController = screen;
                }
                // Skip master, as it should have been handled above
                if (path.master) {
                    continue;
                }
                // It's not a root controller, continue searching...
                let hasRequiredData = true;
                // Should check the equality of static parameters
                if (path.staticParameters) {
                    if (!pathParameters) {
                        hasRequiredData = false;
                    } else {
                        Object.keys(path.staticParameters).forEach((parameter) => {
                            if (pathParameters[parameter] !== path.staticParameters[parameter]) {
                                hasRequiredData = false;
                            }
                        });
                    }
                }
                // Should check the persistance of dynamic parameters
                if (hasRequiredData && path.dynamicParameters) {
                    if (!pathParameters) {
                        hasRequiredData = false;
                    } else {
                        Object.keys(path.dynamicParameters).forEach((parameter) => {
                            if (!pathParameters[parameter]) {
                                hasRequiredData = false;
                            }
                        });
                    }
                }
                // If has required data than set the route name
                if (hasRequiredData) {
                    routeName = screen;
                    // Route name is found, let's define route params
                    params = { ...pathParameters };
                    // Remove static parameters from navigation params
                    if (path.staticParameters) {
                        const parameters = Object.keys(path.staticParameters);
                        for (let j = 0; j < parameters.length; j += 1) {
                            const parameter = parameters[j];
                            delete params[parameter];
                        }
                        // Found the screen with appropriate static parameters.
                        // No need to search further.
                        break;
                    }
                    // TODO: think of how to be with pages without static parameters,
                    // But with those which content differes depending on dynamic parameters
                }
            }
        }
        if (!routeName) {
            routeName = rootController;
            params = null;
        }
        if (routeName === rootController) {
            rootController = null;
        } else if (!rootController) {
            console.log('[PathMap] No root controller found for this page:', routeName, pathParameters);
        }

        if (!routeName) {
            routeName = pathName === '' ? this.defaultScreen() : this.errorScreen();
            params = pathName === '' ? pathParameters : null;
        }
        callback({ routeName, params, rootController });
    }

    static addPathToScreens(screens) {
        Object.keys(screens).forEach((screen) => {
            const screenConfig = screens[screen];
            const pathAndParams = this.pathAndParamsForScreen(screen);
            screenConfig.screen.setPathAndParamsForScreen(pathAndParams, screen);
        });
        return screens;
    }

    static pathAndParamsForScreen(screen) {
        const paths = this.initialPaths()[screen];
        if (!paths) {
            console.warn('[PathMap] There are no paths for screen:', screen);
        }
        return { path: this.getURLPath(paths, screen), params: paths.dynamicParameters };
    }

    static getURLPath({ name, staticParameters }, screen) {
        if (!name) {
            console.warn('[PathMap] There is no path name for screen:', screen);
            return null;
        }
        let path = name;
        const params = [];
        if (staticParameters) {
            Object.keys(staticParameters).forEach((key) => {
                params.push(`${key}=${staticParameters[key]}`);
            });
        }
        if (params.length) {
            path += `?${params.join('&')}`;
        }
        return path;
    }
}


// WEBPACK FOOTER //
// src/controllers/Navigator/PathMap/index.js
