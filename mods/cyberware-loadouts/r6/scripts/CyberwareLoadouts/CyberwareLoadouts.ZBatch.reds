module CyberwareLoadoutsV3

public class CyberwareLoadoutBatchSystem extends ScriptableSystem {
public static func GetInstance(game: GameInstance) -> ref<CyberwareLoadoutBatchSystem> {
  return GameInstance.GetScriptableSystemsContainer(game).Get(n"CyberwareLoadoutsV3.CyberwareLoadoutBatchSystem") as CyberwareLoadoutBatchSystem;
}

private func OnCyberwareLoadoutBatchRequest(request: ref<CyberwareLoadoutBatchRequest>) -> Void {
  let player = request.owner as PlayerPuppet;
  let playerData: ref<EquipmentSystemPlayerData>;
  let system: ref<CyberwareLoadoutSystem>;
  let safety: ref<CyberwareLoadoutResult>;
  let observed: array<ref<CyberwareLoadoutEntry>>;
  let postRemoval: array<ref<CyberwareLoadoutEntry>>;
  let finalObserved: array<ref<CyberwareLoadoutEntry>>;
  let transitionTarget: array<ref<CyberwareLoadoutEntry>>;
  let resolvedTarget: array<ref<CyberwareLoadoutEntry>>;
  let expected: array<ref<CyberwareLoadoutEntry>>;
  let resolveResult: ref<CyberwareLoadoutResult>;
  let unequipRequest: ref<UnequipRequest>;
  let equipRequest: ref<GameplayEquipRequest>;
  let mutated: Bool = false;
  let statsSystem: ref<StatsSystem>;
  let capacityBoosterHumanity: Float;
  let captureResult: ref<CyberwareLoadoutResult>;
  let direction: String;
  let humanityAvailable: Float;
  let i: Int32 = 0;

  if request.rollback { direction = "rollback"; } else { direction = "forward"; }
  if !IsDefined(player) {
    this.CWL_NotifyBatchComplete(request, true, false, CyberwareLoadoutResultCode.NoPlayer, "玩家尚未就绪 / Player unavailable", request.target);
    return;
  }

  playerData = EquipmentSystem.GetData(player);
  system = request.replySystem;
  if !IsDefined(playerData) || !IsDefined(system) {
    this.CWL_NotifyBatchComplete(request, true, false, CyberwareLoadoutResultCode.NoEquipmentData, "装备系统尚未就绪 / Equipment unavailable", request.target);
    return;
  }

  safety = system.CheckSwitchSafety(player);
  if !safety.IsSuccess() {
    this.CWL_NotifyBatchComplete(request, true, false, safety.code, safety.detail, request.target);
    return;
  }

  captureResult = playerData.CWL_CaptureCyberware(player, observed);
  if !captureResult.IsSuccess() {
    this.CWL_NotifyBatchComplete(request, true, false, captureResult.code, captureResult.detail, request.target);
    return;
  }
  if !CyberwareLoadoutEntry.ArraysMatch(observed, request.current) {
    this.CWL_NotifyBatchComplete(request, true, false, CyberwareLoadoutResultCode.Busy, "装备状态在预检后发生变化 / Equipment changed after preflight", request.target);
    return;
  }

  resolveResult = playerData.CWL_ResolveEntries(player, request.target, observed, s"\(direction).preDetach", transitionTarget);
  if !resolveResult.IsSuccess() {
    this.CWL_NotifyBatchComplete(request, true, false, resolveResult.code, resolveResult.detail, request.target);
    return;
  }

  while i < ArraySize(request.current) {
    if !CyberwareLoadoutEntry.ContainsExact(transitionTarget, request.current[i])
      && !this.CWL_EntryHasTag(player, request.current[i], n"CapacityBooster") {
      unequipRequest = new UnequipRequest();
      unequipRequest.owner = player;
      unequipRequest.areaType = request.current[i].area;
      unequipRequest.slotIndex = request.current[i].slotIndex;
      unequipRequest.force = false;
      playerData.OnUnequipRequest(unequipRequest);
      mutated = true;
    }
    i += 1;
  }

  i = 0;
  statsSystem = GameInstance.GetStatsSystem(player.GetGame());
  while i < ArraySize(request.current) {
    if !CyberwareLoadoutEntry.ContainsExact(transitionTarget, request.current[i])
      && this.CWL_EntryHasTag(player, request.current[i], n"CapacityBooster") {
      capacityBoosterHumanity = statsSystem.GetStatValue(Cast<StatsObjectID>(player.GetEntityID()), gamedataStatType.CapacityBoosterHumanity);
      humanityAvailable = statsSystem.GetStatValue(Cast<StatsObjectID>(player.GetEntityID()), gamedataStatType.HumanityAvailable);
      if humanityAvailable < capacityBoosterHumanity {
        this.CWL_NotifyBatchComplete(request, true, mutated, CyberwareLoadoutResultCode.CapacityExceeded, "当前容量不足以安全移除容量增幅义体 / Capacity booster removal is blocked", transitionTarget);
        return;
      }
      unequipRequest = new UnequipRequest();
      unequipRequest.owner = player;
      unequipRequest.areaType = request.current[i].area;
      unequipRequest.slotIndex = request.current[i].slotIndex;
      unequipRequest.force = false;
      playerData.OnUnequipRequest(unequipRequest);
      mutated = true;
    }
    i += 1;
  }

  captureResult = playerData.CWL_CaptureCyberware(player, postRemoval);
  if !captureResult.IsSuccess() {
    this.CWL_NotifyBatchComplete(request, true, mutated, captureResult.code, captureResult.detail, transitionTarget);
    return;
  }
  resolveResult = playerData.CWL_ResolveEntries(player, transitionTarget, postRemoval, s"\(direction).postDetach", resolvedTarget);
  if !resolveResult.IsSuccess() {
    this.CWL_NotifyBatchComplete(request, true, mutated, resolveResult.code, resolveResult.detail, transitionTarget);
    return;
  }
  if !this.CWL_TargetProgramsAvailable(player, postRemoval, resolvedTarget) {
    this.CWL_NotifyBatchComplete(request, true, mutated, CyberwareLoadoutResultCode.MissingItem, "程序在卸载后不可用；正在恢复原装备 / Cyberdeck program unavailable after detach", resolvedTarget);
    return;
  }

  i = 0;
  while i < ArraySize(resolvedTarget) {
    if !CyberwareLoadoutEntry.ContainsExact(postRemoval, resolvedTarget[i])
      && this.CWL_EntryHasTag(player, resolvedTarget[i], n"CapacityBooster") {
      equipRequest = new GameplayEquipRequest();
      equipRequest.owner = player;
      equipRequest.itemID = resolvedTarget[i].itemID;
      equipRequest.slotIndex = resolvedTarget[i].slotIndex;
      playerData.OnGameplayEquipRequest(equipRequest);
      playerData.CWL_RestoreParts(player, resolvedTarget[i]);
      mutated = true;
    }
    i += 1;
  }

  i = 0;
  while i < ArraySize(resolvedTarget) {
    if !CyberwareLoadoutEntry.ContainsExact(postRemoval, resolvedTarget[i])
      && !this.CWL_EntryHasTag(player, resolvedTarget[i], n"CapacityBooster") {
      equipRequest = new GameplayEquipRequest();
      equipRequest.owner = player;
      equipRequest.itemID = resolvedTarget[i].itemID;
      equipRequest.slotIndex = resolvedTarget[i].slotIndex;
      playerData.OnGameplayEquipRequest(equipRequest);
      playerData.CWL_RestoreParts(player, resolvedTarget[i]);
      mutated = true;
    }
    i += 1;
  }

  captureResult = playerData.CWL_CaptureCyberware(player, finalObserved);
  if !captureResult.IsSuccess() {
    this.CWL_NotifyBatchComplete(request, true, mutated, captureResult.code, captureResult.detail, resolvedTarget);
    return;
  }
  resolveResult = playerData.CWL_ResolveEntries(player, resolvedTarget, finalObserved, s"\(direction).final", expected);
  if !resolveResult.IsSuccess() {
    this.CWL_NotifyBatchComplete(request, true, mutated, resolveResult.code, resolveResult.detail, resolvedTarget);
    return;
  }
  this.CWL_NotifyBatchComplete(request, false, mutated, CyberwareLoadoutResultCode.Success, "", expected);
}

private func CWL_TargetProgramsAvailable(
  player: ref<PlayerPuppet>,
  current: array<ref<CyberwareLoadoutEntry>>,
  target: array<ref<CyberwareLoadoutEntry>>
) -> Bool {
  let transactionSystem = GameInstance.GetTransactionSystem(player.GetGame());
  let installedPart: InnerItemData;
  let itemData: wref<gameItemData>;
  let i: Int32 = 0;
  let j: Int32;
  while i < ArraySize(target) {
    if !CyberwareLoadoutEntry.ContainsExact(current, target[i]) {
      j = 0;
      itemData = transactionSystem.GetItemData(player, target[i].itemID);
      while j < ArraySize(target[i].parts) {
        if !transactionSystem.HasItem(player, target[i].parts[j]) {
          if !IsDefined(itemData) { return false; }
          itemData.GetItemPart(installedPart, target[i].partSlots[j]);
          if NotEquals(InnerItemData.GetItemID(installedPart), target[i].parts[j]) { return false; }
        }
        j += 1;
      }
    }
    i += 1;
  }
  return true;
}

private func CWL_EntryHasTag(player: ref<PlayerPuppet>, entry: ref<CyberwareLoadoutEntry>, tag: CName) -> Bool {
  let itemData = GameInstance.GetTransactionSystem(player.GetGame()).GetItemData(player, entry.itemID);
  return IsDefined(itemData) && itemData.HasTag(tag);
}

private func CWL_NotifyBatchComplete(
  batch: ref<CyberwareLoadoutBatchRequest>,
  blocked: Bool,
  mutated: Bool,
  blockedCode: CyberwareLoadoutResultCode,
  blockedDetail: String,
  expected: array<ref<CyberwareLoadoutEntry>>
) -> Void {
  let complete = new CyberwareLoadoutBatchCompleteRequest();
  let player = batch.owner as PlayerPuppet;
  let playerData: ref<EquipmentSystemPlayerData>;
  complete.token = batch.token;
  complete.rollback = batch.rollback;
  complete.blocked = blocked;
  complete.mutated = mutated;
  complete.blockedCode = blockedCode;
  complete.blockedDetail = blockedDetail;
  complete.expected = expected;
  if IsDefined(player) {
    playerData = EquipmentSystem.GetData(player);
    if IsDefined(playerData) { playerData.CWL_CaptureCyberware(player, complete.observed); }
  }
  if IsDefined(batch.replySystem) { batch.replySystem.QueueRequest(complete); }
}
}
