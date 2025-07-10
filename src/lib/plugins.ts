
// src/lib/plugins.ts

interface Plugin {
  id: string;
  name: string;
  init: (api: PluginApi) => void;
}

interface PluginApi {
  // Expose core APIs here for plugins to interact with
  // Example: registerCommand, registerWidget, getTasks, updateTask, etc.
  registerCommand: (command: { id: string; name: string; run: () => void }) => void;
  registerWidget: (widget: { id: string; name: string; component: React.ComponentType }) => void;
  // ... other APIs
}

const registeredPlugins: Plugin[] = [];
const registeredCommands: { id: string; name: string; run: () => void }[] = [];
const registeredWidgets: { id: string; name: string; component: React.ComponentType }[] = [];

export function registerPlugin(plugin: Plugin) {
  registeredPlugins.push(plugin);
}

export function loadPlugins() {
  const pluginApi: PluginApi = {
    registerCommand: (command) => {
      registeredCommands.push(command);
      console.log(`Command registered: ${command.name}`);
    },
    registerWidget: (widget) => {
      registeredWidgets.push(widget);
      console.log(`Widget registered: ${widget.name}`);
    },
  };

  registeredPlugins.forEach((plugin) => {
    console.log(`Loading plugin: ${plugin.name}`);
    plugin.init(pluginApi);
  });
}

export function getRegisteredCommands() {
  return registeredCommands;
}

export function getRegisteredWidgets() {
  return registeredWidgets;
}
