module CyberwareLoadoutsV3

@addField(RipperDocGameController)
private let m_cwlPanel: wref<inkVerticalPanel>;

@addField(RipperDocGameController)
private let m_cwlPresetLabel0: wref<inkText>;

@addField(RipperDocGameController)
private let m_cwlPresetLabel1: wref<inkText>;

@addField(RipperDocGameController)
private let m_cwlPresetLabel2: wref<inkText>;

@addField(RipperDocGameController)
private let m_cwlStatus: wref<inkText>;

@wrapMethod(RipperDocGameController)
private final func Init() -> Void {
  wrappedMethod();
  this.CWL_CreatePanel();
}

@addMethod(RipperDocGameController)
private final func CWL_CreatePanel() -> Void {
  let panel: ref<inkVerticalPanel>;
  let title: ref<inkText>;
  let status: ref<inkText>;
  let i: Int32 = 0;

  if IsDefined(this.m_cwlPanel) {
    return;
  }

  panel = new inkVerticalPanel();
  panel.SetName(n"CyberwareLoadoutsPanel");
  panel.SetAnchor(inkEAnchor.BottomRight);
  panel.SetAnchorPoint(Vector2(1.0, 1.0));
  panel.SetMargin(inkMargin(0.0, 0.0, 70.0, 150.0));
  panel.SetChildMargin(inkMargin(0.0, 10.0, 0.0, 10.0));
  panel.SetInteractive(true);
  panel.Reparent(this.GetRootCompoundWidget());
  this.m_cwlPanel = panel;

  title = this.CWL_CreateText("义体预设 / CYBERWARE LOADOUTS", 30, n"MainColors.Red");
  title.SetMargin(inkMargin(0.0, 0.0, 0.0, 8.0));
  title.Reparent(panel);

  while i < 3 {
    this.CWL_CreatePresetRow(panel, i);
    i += 1;
  }

  status = this.CWL_CreateText("", 20, n"MainColors.White");
  status.SetMargin(inkMargin(0.0, 8.0, 0.0, 0.0));
  status.Reparent(panel);
  this.m_cwlStatus = status;

  this.CWL_RefreshPanel("选择保存或装备 / SAVE OR EQUIP");
}

@addMethod(RipperDocGameController)
private final func CWL_CreatePresetRow(parent: ref<inkCompoundWidget>, index: Int32) -> Void {
  let row = new inkHorizontalPanel();
  let label = this.CWL_CreateText("", 26, n"MainColors.White");
  let save = this.CWL_CreateText("[ 保存 / SAVE ]", 24, n"MainColors.Blue");
  let apply = this.CWL_CreateText("[ 装备 / EQUIP ]", 24, n"MainColors.Red");

  row.SetName(StringToName(s"CWLRow\(index)"));
  row.SetChildMargin(inkMargin(0.0, 0.0, 18.0, 0.0));
  row.SetFitToContent(false);
  row.SetSize(Vector2(916.0, 72.0));
  row.Reparent(parent);

  label.SetFitToContent(false);
  label.SetSize(Vector2(340.0, 72.0));
  label.Reparent(row);

  save.SetName(StringToName(s"CWLSave\(index)"));
  save.SetFitToContent(false);
  save.SetSize(Vector2(260.0, 72.0));
  save.SetHorizontalAlignment(textHorizontalAlignment.Center);
  save.SetVerticalAlignment(textVerticalAlignment.Center);
  save.SetInteractive(true);
  save.Reparent(row);
  apply.SetName(StringToName(s"CWLApply\(index)"));
  apply.SetFitToContent(false);
  apply.SetSize(Vector2(280.0, 72.0));
  apply.SetHorizontalAlignment(textHorizontalAlignment.Center);
  apply.SetVerticalAlignment(textVerticalAlignment.Center);
  apply.SetInteractive(true);
  apply.Reparent(row);

  switch index {
    case 0:
      this.m_cwlPresetLabel0 = label;
      save.RegisterToCallback(n"OnRelease", this, n"OnCWLSave0");
      apply.RegisterToCallback(n"OnRelease", this, n"OnCWLApply0");
      break;
    case 1:
      this.m_cwlPresetLabel1 = label;
      save.RegisterToCallback(n"OnRelease", this, n"OnCWLSave1");
      apply.RegisterToCallback(n"OnRelease", this, n"OnCWLApply1");
      break;
    case 2:
      this.m_cwlPresetLabel2 = label;
      save.RegisterToCallback(n"OnRelease", this, n"OnCWLSave2");
      apply.RegisterToCallback(n"OnRelease", this, n"OnCWLApply2");
      break;
  }
}

@addMethod(RipperDocGameController)
private final func CWL_CreateText(value: String, fontSize: Int32, colorProperty: CName) -> ref<inkText> {
  let text = new inkText();
  text.SetFontFamily("base\\gameplay\\gui\\fonts\\raj\\raj.inkfontfamily");
  text.SetFontStyle(n"Regular");
  text.SetFontSize(fontSize);
  text.SetStyle(r"base\\gameplay\\gui\\common\\main_colors.inkstyle");
  text.BindProperty(n"tintColor", colorProperty);
  text.SetText(value);
  text.SetLetterCase(textLetterCase.UpperCase);
  text.SetHAlign(inkEHorizontalAlign.Left);
  text.SetVAlign(inkEVerticalAlign.Center);
  return text;
}

@addMethod(RipperDocGameController)
private final func CWL_RefreshPanel(message: String) -> Void {
  let system = CyberwareLoadoutSystem.GetInstance(this.GetPlayerControlledObject().GetGame());

  if IsDefined(system) {
    if IsDefined(this.m_cwlPresetLabel0) { this.m_cwlPresetLabel0.SetText(system.GetPresetLabel(0)); }
    if IsDefined(this.m_cwlPresetLabel1) { this.m_cwlPresetLabel1.SetText(system.GetPresetLabel(1)); }
    if IsDefined(this.m_cwlPresetLabel2) { this.m_cwlPresetLabel2.SetText(system.GetPresetLabel(2)); }
  }
  if IsDefined(this.m_cwlStatus) {
    this.m_cwlStatus.SetText(message);
  }
}

@addMethod(RipperDocGameController)
private final func CWL_Save(index: Int32) -> Void {
  let system = CyberwareLoadoutSystem.GetInstance(this.GetPlayerControlledObject().GetGame());
  let result: ref<CyberwareLoadoutResult>;

  if !IsDefined(system) {
    this.CWL_RefreshPanel("预设系统不可用 / LOADOUT SYSTEM UNAVAILABLE");
    return;
  }
  result = system.CapturePreset(index, this.GetPlayerControlledObject() as PlayerPuppet);
  this.CWL_RefreshPanel(s"\(result.detail) [\(result.itemCount)]");
}

@addMethod(RipperDocGameController)
private final func CWL_Apply(index: Int32) -> Void {
  let system = CyberwareLoadoutSystem.GetInstance(this.GetPlayerControlledObject().GetGame());
  let result: ref<CyberwareLoadoutResult>;

  if !IsDefined(system) {
    this.CWL_RefreshPanel("预设系统不可用 / LOADOUT SYSTEM UNAVAILABLE");
    return;
  }

  system.SetController(this);
  result = system.ApplyPreset(index, this.GetPlayerControlledObject() as PlayerPuppet);
  this.CWL_RefreshPanel(result.detail);

  if result.IsSuccess() {
    this.PreparePlayerItems();
    this.UpdateMinigrids();
  }
}

@addMethod(RipperDocGameController)
public final func CWL_OnSwitchFinished(result: ref<CyberwareLoadoutResult>) -> Void {
  this.CWL_RefreshPanel(result.detail);
  this.PreparePlayerItems();
  this.UpdateMinigrids();
}

@addMethod(RipperDocGameController)
protected cb func OnCWLSave0(evt: ref<inkPointerEvent>) -> Bool {
  if evt.IsAction(n"click") { this.CWL_Save(0); return true; }
  return false;
}

@addMethod(RipperDocGameController)
protected cb func OnCWLSave1(evt: ref<inkPointerEvent>) -> Bool {
  if evt.IsAction(n"click") { this.CWL_Save(1); return true; }
  return false;
}

@addMethod(RipperDocGameController)
protected cb func OnCWLSave2(evt: ref<inkPointerEvent>) -> Bool {
  if evt.IsAction(n"click") { this.CWL_Save(2); return true; }
  return false;
}

@addMethod(RipperDocGameController)
protected cb func OnCWLApply0(evt: ref<inkPointerEvent>) -> Bool {
  if evt.IsAction(n"click") { this.CWL_Apply(0); return true; }
  return false;
}

@addMethod(RipperDocGameController)
protected cb func OnCWLApply1(evt: ref<inkPointerEvent>) -> Bool {
  if evt.IsAction(n"click") { this.CWL_Apply(1); return true; }
  return false;
}

@addMethod(RipperDocGameController)
protected cb func OnCWLApply2(evt: ref<inkPointerEvent>) -> Bool {
  if evt.IsAction(n"click") { this.CWL_Apply(2); return true; }
  return false;
}
