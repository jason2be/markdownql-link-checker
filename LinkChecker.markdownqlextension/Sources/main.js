const states = new Map();

function stateKey(request) {
  const identity = request.context.identity;
  return `${identity.windowID || "window"}:${identity.scopeGeneration}:${identity.contributionID}`;
}

function localState(request) {
  const key = stateKey(request);
  if (!states.has(key)) states.set(key, {
    filter: "all", result: null, status: "checking", failure: null
  });
  return states.get(key);
}

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
    title: "链接检查", checking: "正在检查当前文档…", all: "全部", broken: "损坏",
    unknown: "无法验证", clean: "没有发现链接问题。", refresh: "重新检查", filter: "筛选",
    complete: value => `发现 ${value.candidateCount} 个链接；已验证 ${value.verifiedCount} 个；问题 ${value.issues.length} 个。`,
    partial: value => `结果不完整：发现 ${value.candidateCount} 个链接，已验证 ${value.verifiedCount} 个，无法验证 ${value.unverifiableCount} 个。`,
    timedOut: "检查达到整体时间限制。", candidatesCut: "候选链接超过 512 个，剩余项目未验证。",
    issuesCut: "问题超过 256 个；这里只显示前 256 个。", stale: "文档在检查后已改变。旧结果仍可查看，请重新检查后再定位。",
    failed: "检查未完成。上一次成功结果已保留，请重新检查。", navigationFailed: "无法定位这个旧问题。结果已保留，请重新检查。",
    row: issue => `${issue.severity === "broken" ? "损坏" : "无法验证"}：${issue.target}。${issue.message}。第 ${issue.line} 行，第 ${issue.column} 列`
  } : {
    title: "Link Checker", checking: "Checking the current document…", all: "All", broken: "Broken",
    unknown: "Unverifiable", clean: "No link problems found.", refresh: "Check Again", filter: "Filter",
    complete: value => `${value.candidateCount} link(s) found; ${value.verifiedCount} verified; ${value.issues.length} issue(s).`,
    partial: value => `Partial result: ${value.candidateCount} found, ${value.verifiedCount} verified, ${value.unverifiableCount} unverifiable.`,
    timedOut: "The check reached its overall time limit.", candidatesCut: "More than 512 links were found; remaining links were not verified.",
    issuesCut: "More than 256 issues were found; the first 256 are shown.", stale: "The document changed after this check. Old results remain visible; check again before navigating.",
    failed: "The check did not finish. The last successful result is still available; check again.", navigationFailed: "This old issue could not be located. The result remains available; check again.",
    row: issue => `${issue.severity === "broken" ? "Broken" : "Unverifiable"}: ${issue.target}. ${issue.message}. Line ${issue.line}, column ${issue.column}`
  };
}

async function capability(request, operation, parameters, directAction) {
  const value = capabilityContext(request);
  return markdownql.capabilities.request({
    windowHandle: value.windowHandle,
    windowGeneration: value.windowGeneration,
    workspaceGeneration: value.workspaceGeneration,
    documentGeneration: value.documentGeneration,
    capabilityID: "document.links.check",
    operation,
    parameters: parameters || {},
    userActionToken: directAction ? value.userActionToken : undefined
  });
}

async function runCheck(request, local) {
  local.status = "checking";
  local.failure = null;
  try {
    local.result = await capability(request, "run", {}, false);
    local.status = (local.result.timedOut || local.result.candidateTruncated || local.result.issueListTruncated)
      ? "partial" : "complete";
  } catch (_) {
    local.status = local.result ? "recoverable-failure" : "unavailable";
    local.failure = "run";
  }
}

function issueVisible(issue, filter) {
  return filter === "all" || issue.severity === filter;
}

function resultTree(request, local) {
  const copy = strings(request);
  const result = local.result;
  const children = [
    { id: "link-checker-title", type: "label", text: copy.title, systemImage: "link.badge.plus" }
  ];
  if (!result) {
    children.push({
      id: local.status === "checking" ? "link-checker-checking" : "link-checker-unavailable",
      type: "empty-state", title: local.status === "checking" ? copy.checking : copy.failed,
      detail: null, systemImage: local.status === "checking" ? "hourglass" : "exclamationmark.triangle"
    });
  } else {
    children.push({
      id: "link-checker-summary", type: "text",
      text: local.status === "partial" ? copy.partial(result) : copy.complete(result)
    });
    if (local.status === "partial") {
      const reasons = [];
      if (result.timedOut) reasons.push(copy.timedOut);
      if (result.candidateTruncated) reasons.push(copy.candidatesCut);
      if (result.issueListTruncated) reasons.push(copy.issuesCut);
      children.push({ id: "link-checker-partial", type: "card", children: [
        { id: "link-checker-partial-message", type: "text", text: reasons.join(" ") }
      ] });
    }
    if (local.status === "stale") children.push({ id: "link-checker-stale", type: "card", children: [
      { id: "link-checker-stale-message", type: "text", text: copy.stale }
    ] });
    if (local.status === "recoverable-failure") children.push({ id: "link-checker-failure", type: "card", children: [
      { id: "link-checker-failure-message", type: "text", text: local.failure === "navigate-issue" ? copy.navigationFailed : copy.failed }
    ] });
    children.push({
      id: "link-checker-filter", accessibilityIdentifier: "markdownql.link-checker.filter",
      type: "picker", title: copy.filter, selection: local.filter, options: [
        { id: "all", title: copy.all }, { id: "broken", title: copy.broken },
        { id: "unverifiable", title: copy.unknown }
      ]
    });
    const issues = (Array.isArray(result.issues) ? result.issues : [])
      .map((issue, sourceIndex) => ({ issue, sourceIndex }))
      .filter(value => issueVisible(value.issue, local.filter));
    if (!issues.length) {
      children.push({ id: "link-checker-clean", type: "empty-state", title: copy.clean,
        detail: null, systemImage: "checkmark.circle" });
    } else {
      children.push({ id: "link-checker-results", type: "list", page: null, items: issues.map(value => ({
        id: `issue-${value.sourceIndex}`,
        accessibilityIdentifier: `markdownql.link-checker.issue.${value.sourceIndex}`,
        accessibilityLabel: copy.row(value.issue),
        type: "action-button", title: copy.row(value.issue), actionID: "navigate-issue",
        arguments: { runHandle: result.runHandle, issueHandle: value.issue.issueHandle }
      })) });
    }
  }
  children.push({
    id: "link-checker-refresh", accessibilityIdentifier: "markdownql.link-checker.refresh",
    type: "action-button", title: copy.refresh, actionID: "refresh", arguments: {},
    nodeSystemImage: "arrow.clockwise", controlStyle: "bordered-prominent"
  });
  return { id: "link-checker-root", type: "column", children };
}

async function render(request) {
  const local = localState(request);
  await runCheck(request, local);
  return resultTree(request, local);
}

async function handleEvent(request) {
  const local = localState(request);
  const selected = request.event && request.event.selectionChanged;
  if (selected && request.nodeID === "link-checker-filter") local.filter = selected.value;
  const action = request.event && request.event.action;
  if (action && action.actionID === "refresh") await runCheck(request, local);
  if (action && action.actionID === "navigate-issue" && local.status !== "stale") {
    try {
      await capability(request, "navigate-issue", {
        runHandle: action.arguments.runHandle,
        issueHandle: action.arguments.issueHandle
      }, true);
    } catch (error) {
      local.status = error && error.code === "stale-revision" ? "stale" : "recoverable-failure";
      local.failure = "navigate-issue";
    }
  }
  return { root: resultTree(request, local) };
}

markdownql.registerCommand("check-links", () => ({ requested: true }));
markdownql.registerSurface("link-checker-window", render, handleEvent);
