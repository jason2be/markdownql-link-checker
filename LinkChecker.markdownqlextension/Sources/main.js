function capabilityContext(request) {
  const state = request.context && request.context.state;
  const value = state && state.capabilityContext;
  if (!value || !value.windowHandle) throw new Error("Link Checker requires an active document window.");
  return value;
}

function strings(request) {
  const locale = request.context && request.context.state && request.context.state.locale;
  const zh = typeof locale === "string" && locale.toLowerCase().startsWith("zh");
  return zh ? {
    title: "链接检查", checked: count => `已检查 ${count} 个链接`,
    clean: "没有发现链接问题。", broken: "损坏", unknown: "无法验证",
    refresh: "重新检查", location: issue => `第 ${issue.line} 行，第 ${issue.column} 列`
  } : {
    title: "Link Checker", checked: count => `${count} link(s) checked`,
    clean: "No link problems found.", broken: "Broken", unknown: "Unverifiable",
    refresh: "Check Again", location: issue => `Line ${issue.line}, column ${issue.column}`
  };
}

async function runCheck(request) {
  const value = capabilityContext(request);
  return markdownql.capabilities.request({
    windowHandle: value.windowHandle,
    windowGeneration: value.windowGeneration,
    workspaceGeneration: value.workspaceGeneration,
    documentGeneration: value.documentGeneration,
    capabilityID: "document.links.check",
    operation: "run",
    parameters: {}
  });
}

function resultTree(request, result) {
  const copy = strings(request);
  const issues = Array.isArray(result.issues) ? result.issues : [];
  const children = [
    { id: "link-checker-title", type: "label", text: copy.title, systemImage: "link.badge.plus" },
    { id: "link-checker-summary", type: "text", text: copy.checked(result.checkedCount || 0) }
  ];
  if (!issues.length) {
    children.push({ id: "link-checker-clean", type: "card", children: [
      { id: "link-checker-clean-label", type: "label", text: copy.clean, systemImage: "checkmark.circle" }
    ] });
  } else {
    issues.slice(0, 256).forEach((issue, index) => {
      const broken = issue.severity === "broken";
      children.push({ id: `issue-${index}`, type: "card", children: [
        { id: `issue-${index}-status`, type: "label", text: broken ? copy.broken : copy.unknown,
          systemImage: broken ? "xmark.circle" : "questionmark.circle" },
        { id: `issue-${index}-target`, type: "text", text: issue.target || "" },
        { id: `issue-${index}-message`, type: "text", text: issue.message || "" },
        { id: `issue-${index}-location`, type: "text", text: copy.location(issue) }
      ] });
    });
  }
  children.push({ id: "link-checker-refresh", type: "action-button", title: copy.refresh,
    actionID: "refresh", arguments: {} });
  return { id: "link-checker-root", type: "column", children };
}

async function render(request) {
  return resultTree(request, await runCheck(request));
}

async function handleEvent(request) {
  return { root: resultTree(request, await runCheck(request)) };
}

markdownql.registerCommand("check-links", () => ({ requested: true }));
markdownql.registerSurface("link-checker-window", render, handleEvent);
