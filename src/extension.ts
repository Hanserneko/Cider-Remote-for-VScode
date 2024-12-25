import * as vscode from "vscode";

function getConfig() {
  const config = vscode.workspace.getConfiguration("ciderRemote");
  const apiToken = config.get<string>("apiToken", "");
  const baseURL = config.get<string>(
    "baseURL",
    "http://localhost:10767/api/v1/playback"
  );
  return { apiToken, baseURL };
}

async function sendRequest(
  endpoint: string,
  method: string = "GET",
  body?: any
) {
  const { apiToken, baseURL } = getConfig();

  if (!apiToken) {
    vscode.window.showErrorMessage(
      "Cider Remote: Missing API Token. Please configure it in settings."
    );
    return;
  }

  const url = `${baseURL}${endpoint}`;

  const options: RequestInit = {
    method,
    ...((body && {
      headers: { "Content-Type": "application/json", apptoken: apiToken },
    }) ||
      (!body && { headers: { apptoken: apiToken } })),
    ...(body && { body: JSON.stringify(body) }),
  };

  try {
    const response = await fetch(url, options);

    if (response.ok) {
      const result = await response.json();
      return result;
    } else {
      vscode.window.showErrorMessage(
        `Cider Remote Error: ${response.statusText}`
      );
    }
  } catch (error: any) {
    // vscode.window.showErrorMessage(
    //   `Cider Remote Request Failed: ${error.message}`
    // );
  }
}

export function activate(context: vscode.ExtensionContext) {
  const toggleButton = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    1000
  );
  toggleButton.text = "$(play-circle)";
  toggleButton.command = "cider-remote.toggle";
  toggleButton.tooltip = "Toggle Play/Pause";
  toggleButton.show();
  context.subscriptions.push(toggleButton);

  const nextButton = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    999
  );
  nextButton.text = "$(arrow-right)";
  nextButton.command = "cider-remote.next";
  nextButton.tooltip = "Next Track";
  nextButton.show();
  context.subscriptions.push(nextButton);

  const prevButton = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    1001
  );
  prevButton.text = "$(arrow-left)";
  prevButton.command = "cider-remote.previous";
  prevButton.tooltip = "Previous Track";
  prevButton.show();
  context.subscriptions.push(prevButton);

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "cider-remote.play",
      async () => await sendRequest("/play", "POST")
    ),
    vscode.commands.registerCommand(
      "cider-remote.pause",
      async () => await sendRequest("/pause", "POST")
    ),
    vscode.commands.registerCommand(
      "cider-remote.toggle",
      async () => await sendRequest("/playpause", "POST")
    ),
    vscode.commands.registerCommand(
      "cider-remote.stop",
      async () => await sendRequest("/stop", "POST")
    ),
    vscode.commands.registerCommand(
      "cider-remote.next",
      async () => await sendRequest("/next", "POST")
    ),
    vscode.commands.registerCommand(
      "cider-remote.previous",
      async () => await sendRequest("/previous", "POST")
    ),
    vscode.commands.registerCommand("cider-remote.volumn", async () => {
      const volume = await vscode.window.showInputBox({
        prompt: `Enter volume (0 to 1):`,
      });
      if (volume) {
        await sendRequest("/volume", "POST", { volume: parseFloat(volume) });
      }
    })
  );
}

export function deactivate() {}
