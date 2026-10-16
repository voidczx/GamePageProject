module CyberwareLoadoutsV3

public class CyberwareLoadoutSystem extends ScriptableSystem {
  private persistent let preset0Initialized: Bool;
  private persistent let preset1Initialized: Bool;
  private persistent let preset2Initialized: Bool;
  private persistent let storedEntryPresets: array<Int32>;
  private persistent let storedEntryOrdinals: array<Int32>;
  private persistent let storedEntryAreas: array<gamedataEquipmentArea>;
  private persistent let storedEntrySlots: array<Int32>;
  private persistent let storedEntryItemIDs: array<ItemID>;
  private persistent let storedEntryRecords: array<TweakDBID>;
  private persistent let storedPartPresets: array<Int32>;
  private persistent let storedPartEntryOrdinals: array<Int32>;
  private persistent let storedPartIDs: array<ItemID>;
  private persistent let storedPartSlots: array<TweakDBID>;
  private let switchInProgress: Bool;
  private let switchToken: Int32;
  private let activePresetIndex: Int32;
  private let activePlayer: wref<PlayerPuppet>;
  private let activeBefore: array<ref<CyberwareLoadoutEntry>>;
  private let activeTarget: array<ref<CyberwareLoadoutEntry>>;
  private let activeController: wref<RipperDocGameController>;

  public static func GetInstance(game: GameInstance) -> ref<CyberwareLoadoutSystem> {
    return GameInstance.GetScriptableSystemsContainer(game).Get(n"CyberwareLoadoutsV3.CyberwareLoadoutSystem") as CyberwareLoadoutSystem;
  }

  private func IsFlatStorageConsistent() -> Bool {
    let entryCount = ArraySize(this.storedEntryPresets);
    let partCount = ArraySize(this.storedPartPresets);
    return entryCount == ArraySize(this.storedEntryOrdinals)
      && entryCount == ArraySize(this.storedEntryAreas)
      && entryCount == ArraySize(this.storedEntrySlots)
      && entryCount == ArraySize(this.storedEntryItemIDs)
      && entryCount == ArraySize(this.storedEntryRecords)
      && partCount == ArraySize(this.storedPartEntryOrdinals)
      && partCount == ArraySize(this.storedPartIDs)
      && partCount == ArraySize(this.storedPartSlots);
  }

  private func ClearFlatStorage() -> Void {
    this.preset0Initialized = false;
    this.preset1Initialized = false;
    this.preset2Initialized = false;
    ArrayClear(this.storedEntryPresets);
    ArrayClear(this.storedEntryOrdinals);
    ArrayClear(this.storedEntryAreas);
    ArrayClear(this.storedEntrySlots);
    ArrayClear(this.storedEntryItemIDs);
    ArrayClear(this.storedEntryRecords);
    ArrayClear(this.storedPartPresets);
    ArrayClear(this.storedPartEntryOrdinals);
    ArrayClear(this.storedPartIDs);
    ArrayClear(this.storedPartSlots);
  }

  private func IsPresetInitialized(index: Int32) -> Bool {
    switch index {
      case 0: return this.preset0Initialized;
      case 1: return this.preset1Initialized;
      case 2: return this.preset2Initialized;
    }
    return false;
  }

  private func SetPresetInitialized(index: Int32, value: Bool) -> Void {
    switch index {
      case 0: this.preset0Initialized = value; break;
      case 1: this.preset1Initialized = value; break;
      case 2: this.preset2Initialized = value; break;
    }
  }

  private func StorePreset(index: Int32, entries: array<ref<CyberwareLoadoutEntry>>) -> Bool {
    let i: Int32 = 0;
    let j: Int32 = 0;
    if index < 0 || index >= 3 || ArraySize(entries) == 0 {
      return false;
    }
    while i < ArraySize(entries) {
      if !IsDefined(entries[i]) || ArraySize(entries[i].parts) != ArraySize(entries[i].partSlots) {
        return false;
      }
      i += 1;
    }
    if !this.IsFlatStorageConsistent() {
      this.ClearFlatStorage();
    }

    i = ArraySize(this.storedEntryPresets) - 1;
    while i >= 0 {
      if this.storedEntryPresets[i] == index {
        ArrayErase(this.storedEntryPresets, i);
        ArrayErase(this.storedEntryOrdinals, i);
        ArrayErase(this.storedEntryAreas, i);
        ArrayErase(this.storedEntrySlots, i);
        ArrayErase(this.storedEntryItemIDs, i);
        ArrayErase(this.storedEntryRecords, i);
      }
      i -= 1;
    }
    i = ArraySize(this.storedPartPresets) - 1;
    while i >= 0 {
      if this.storedPartPresets[i] == index {
        ArrayErase(this.storedPartPresets, i);
        ArrayErase(this.storedPartEntryOrdinals, i);
        ArrayErase(this.storedPartIDs, i);
        ArrayErase(this.storedPartSlots, i);
      }
      i -= 1;
    }

    i = 0;
    while i < ArraySize(entries) {
      ArrayPush(this.storedEntryPresets, index);
      ArrayPush(this.storedEntryOrdinals, i);
      ArrayPush(this.storedEntryAreas, entries[i].area);
      ArrayPush(this.storedEntrySlots, entries[i].slotIndex);
      ArrayPush(this.storedEntryItemIDs, entries[i].itemID);
      ArrayPush(this.storedEntryRecords, entries[i].itemRecord);
      j = 0;
      while j < ArraySize(entries[i].parts) {
        ArrayPush(this.storedPartPresets, index);
        ArrayPush(this.storedPartEntryOrdinals, i);
        ArrayPush(this.storedPartIDs, entries[i].parts[j]);
        ArrayPush(this.storedPartSlots, entries[i].partSlots[j]);
        j += 1;
      }
      i += 1;
    }
    this.SetPresetInitialized(index, true);
    return true;
  }

  public func SetController(controller: wref<RipperDocGameController>) -> Void {
    this.activeController = controller;
  }

  public func GetPreset(index: Int32) -> ref<CyberwareLoadoutPreset> {
    let entry: ref<CyberwareLoadoutEntry>;
    let parts: array<ItemID>;
    let partSlots: array<TweakDBID>;
    let preset: ref<CyberwareLoadoutPreset>;
    let i: Int32 = 0;
    let j: Int32;
    if index < 0 || index >= 3 || !this.IsFlatStorageConsistent() {
      return null;
    }
    preset = new CyberwareLoadoutPreset();
    preset.initialized = this.IsPresetInitialized(index);
    if !preset.initialized {
      return preset;
    }
    while i < ArraySize(this.storedEntryPresets) {
      if this.storedEntryPresets[i] == index {
        ArrayClear(parts);
        ArrayClear(partSlots);
        j = 0;
        while j < ArraySize(this.storedPartPresets) {
          if this.storedPartPresets[j] == index
            && this.storedPartEntryOrdinals[j] == this.storedEntryOrdinals[i] {
            ArrayPush(parts, this.storedPartIDs[j]);
            ArrayPush(partSlots, this.storedPartSlots[j]);
          }
          j += 1;
        }
        entry = CyberwareLoadoutEntry.Create(this.storedEntryAreas[i], this.storedEntrySlots[i], this.storedEntryItemIDs[i], parts, partSlots);
        entry.itemRecord = this.storedEntryRecords[i];
        ArrayPush(preset.entries, entry);
      }
      i += 1;
    }
    return preset;
  }

  public func GetPresetLabel(index: Int32) -> String {
    let preset = this.GetPreset(index);
    if !IsDefined(preset) {
      return "INVALID";
    }
    if !preset.initialized {
      return s"方案 / LOADOUT \(index + 1)  [空 / EMPTY]";
    }
    return s"方案 / LOADOUT \(index + 1)  [\(ArraySize(preset.entries))]";
  }

  public func CapturePreset(index: Int32, player: ref<PlayerPuppet>) -> ref<CyberwareLoadoutResult> {
    let playerData: ref<EquipmentSystemPlayerData>;
    let result: ref<CyberwareLoadoutResult>;
    let snapshot: array<ref<CyberwareLoadoutEntry>>;

    if this.switchInProgress {
      return CyberwareLoadoutResult.Create(CyberwareLoadoutResultCode.Busy, "切换尚未完成 / Switch already in progress");
    }
    if index < 0 || index >= 3 {
      return CyberwareLoadoutResult.Create(CyberwareLoadoutResultCode.InvalidPreset, "无效预设 / Invalid preset");
    }
    if !IsDefined(player) {
      return CyberwareLoadoutResult.Create(CyberwareLoadoutResultCode.NoPlayer, "玩家尚未就绪 / Player unavailable");
    }

    playerData = EquipmentSystem.GetData(player);
    if !IsDefined(playerData) {
      return CyberwareLoadoutResult.Create(CyberwareLoadoutResultCode.NoEquipmentData, "装备系统尚未就绪 / Equipment unavailable");
    }

    result = playerData.CWL_CaptureCyberware(player, snapshot);
    if !result.IsSuccess() {
      return result;
    }
    if ArraySize(snapshot) == 0 {
      return CyberwareLoadoutResult.Create(CyberwareLoadoutResultCode.EmptyCapture, "未检测到义体；拒绝保存空方案 / No cyberware found; empty loadout rejected");
    }

    if !this.StorePreset(index, snapshot) {
      return CyberwareLoadoutResult.Create(CyberwareLoadoutResultCode.InvalidPreset, "预设存储失败；未覆盖旧方案 / Failed to store loadout");
    }

    return CyberwareLoadoutResult.Create(CyberwareLoadoutResultCode.Success, "预设已保存 / Loadout saved", ArraySize(snapshot));
  }

  public func ApplyPreset(index: Int32, player: ref<PlayerPuppet>) -> ref<CyberwareLoadoutResult> {
    let preset = this.GetPreset(index);
    let playerData: ref<EquipmentSystemPlayerData>;
    let current: array<ref<CyberwareLoadoutEntry>>;
    let resolvedTarget: array<ref<CyberwareLoadoutEntry>>;
    let result: ref<CyberwareLoadoutResult>;

    if this.switchInProgress {
      return CyberwareLoadoutResult.Create(CyberwareLoadoutResultCode.Busy, "切换尚未完成 / Switch already in progress");
    }
    if !IsDefined(preset) {
      return CyberwareLoadoutResult.Create(CyberwareLoadoutResultCode.InvalidPreset, "无效预设 / Invalid preset");
    }
    if !preset.initialized {
      return CyberwareLoadoutResult.Create(CyberwareLoadoutResultCode.EmptyPreset, "预设为空，请先保存 / Empty loadout; save first");
    }
    if ArraySize(preset.entries) == 0 {
      return CyberwareLoadoutResult.Create(CyberwareLoadoutResultCode.EmptyPreset, "预设为空，请先保存 / Empty loadout; save first");
    }
    if !IsDefined(player) {
      return CyberwareLoadoutResult.Create(CyberwareLoadoutResultCode.NoPlayer, "玩家尚未就绪 / Player unavailable");
    }

    result = this.CheckSwitchSafety(player);
    if !result.IsSuccess() {
      return result;
    }

    playerData = EquipmentSystem.GetData(player);
    if !IsDefined(playerData) {
      return CyberwareLoadoutResult.Create(CyberwareLoadoutResultCode.NoEquipmentData, "装备系统尚未就绪 / Equipment unavailable");
    }
    if playerData.IsEquipPending() {
      return CyberwareLoadoutResult.Create(CyberwareLoadoutResultCode.Busy, "装备系统正忙 / Equipment transaction pending");
    }

    result = playerData.CWL_CaptureCyberware(player, current);
    if !result.IsSuccess() {
      return result;
    }
    result = playerData.CWL_ResolveEntries(player, preset.entries, current, s"apply.preflight.preset\(index)", resolvedTarget);
    if !result.IsSuccess() {
      return result;
    }

    if this.EntriesMatch(current, resolvedTarget) {
      if !this.StorePreset(index, resolvedTarget) {
        return CyberwareLoadoutResult.Create(CyberwareLoadoutResultCode.InvalidPreset, "当前装备匹配，但无法更新扁平预设存储 / Failed to refresh flat loadout storage");
      }
      return CyberwareLoadoutResult.Create(CyberwareLoadoutResultCode.Success, "方案已是当前装备 / Loadout already equipped", ArraySize(preset.entries));
    }

    result = this.ValidatePreset(player, playerData, resolvedTarget, current);
    if !result.IsSuccess() {
      return result;
    }

    this.switchInProgress = true;
    this.switchToken += 1;
    this.activePresetIndex = index;
    this.activePlayer = player;
    this.activeBefore = current;
    this.activeTarget = resolvedTarget;

    this.QueueTransition(player, current, resolvedTarget, false);
    return CyberwareLoadoutResult.Create(CyberwareLoadoutResultCode.SwitchStarted, "正在安全切换 / Switching safely", ArraySize(resolvedTarget));
  }

  public func OnCyberwareLoadoutBatchCompleteRequest(request: ref<CyberwareLoadoutBatchCompleteRequest>) -> Void {
    let current = request.observed;

    if !this.switchInProgress || request.token != this.switchToken {
      return;
    }

    if !IsDefined(this.activePlayer) {
      this.CompleteSwitch(CyberwareLoadoutResult.Create(CyberwareLoadoutResultCode.NoPlayer, "玩家尚未就绪 / Player unavailable"));
      return;
    }

    if request.blocked {
      if !request.rollback && request.mutated {
        this.QueueTransition(this.activePlayer, current, this.activeBefore, true);
        return;
      }
      if request.rollback {
        this.CompleteSwitch(CyberwareLoadoutResult.Create(CyberwareLoadoutResultCode.RollbackFailed, s"回滚被安全门禁阻止；请重新读档: \(request.blockedDetail) / Rollback blocked; reload save"));
        return;
      }
      this.CompleteSwitch(CyberwareLoadoutResult.Create(request.blockedCode, request.blockedDetail));
      return;
    }

    if !request.rollback {
      if this.EntriesMatch(current, request.expected) {
        if !this.StorePreset(this.activePresetIndex, request.expected) {
          this.CompleteSwitch(CyberwareLoadoutResult.Create(CyberwareLoadoutResultCode.InvalidPreset, "方案已装备，但无法更新扁平预设存储 / Equipped but flat storage update failed"));
          return;
        }
        this.CompleteSwitch(CyberwareLoadoutResult.Create(CyberwareLoadoutResultCode.Success, "方案已装备 / Loadout equipped", ArraySize(current)));
        return;
      }

      this.QueueTransition(this.activePlayer, current, this.activeBefore, true);
      return;
    }

    if this.EntriesMatch(current, request.expected) {
      this.CompleteSwitch(CyberwareLoadoutResult.Create(CyberwareLoadoutResultCode.EquipFailed, "无法装备该方案，已恢复原装备 / Equip failed; previous loadout restored"));
      return;
    }

    this.CompleteSwitch(CyberwareLoadoutResult.Create(CyberwareLoadoutResultCode.RollbackFailed, "切换和回滚均失败；请重新读档 / Switch and rollback failed; reload save"));
  }

  public func CheckSwitchSafety(player: ref<PlayerPuppet>) -> ref<CyberwareLoadoutResult> {
    let blackboard: ref<IBlackboard>;
    let definitions: ref<PlayerStateMachineDef>;
    let combatState: gamePSMCombat;
    let vitalsState: gamePSMVitals;
    let highLevelState: gamePSMHighLevel;
    let swimmingState: gamePSMSwimming;
    let timeDilationState: gamePSMTimeDilation;
    let transactionSystem: ref<TransactionSystem>;
    let itemID: ItemID;
    let itemRecord: wref<Item_Record>;

    if !IsDefined(player) {
      return CyberwareLoadoutResult.Create(CyberwareLoadoutResultCode.NoPlayer, "玩家尚未就绪 / Player unavailable");
    }

    blackboard = player.GetPlayerStateMachineBlackboard();
    if !IsDefined(blackboard) {
      return CyberwareLoadoutResult.Create(CyberwareLoadoutResultCode.PlayerUnavailable, "玩家状态尚未就绪 / Player state unavailable");
    }

    definitions = GetAllBlackboardDefs().PlayerStateMachine;
    combatState = IntEnum<gamePSMCombat>(blackboard.GetInt(definitions.Combat));
    if player.IsInCombat() || Equals(combatState, gamePSMCombat.InCombat) {
      return CyberwareLoadoutResult.Create(CyberwareLoadoutResultCode.InCombat, "战斗中禁止切换 / Switching is disabled in combat");
    }

    vitalsState = IntEnum<gamePSMVitals>(blackboard.GetInt(definitions.Vitals));
    if NotEquals(vitalsState, gamePSMVitals.Alive) {
      return CyberwareLoadoutResult.Create(CyberwareLoadoutResultCode.PlayerUnavailable, "当前生命状态禁止切换 / Invalid player vitals");
    }

    if blackboard.GetBool(definitions.MountedToVehicle) {
      return CyberwareLoadoutResult.Create(CyberwareLoadoutResultCode.InVehicle, "载具中禁止切换 / Switching is disabled in vehicles");
    }

    highLevelState = IntEnum<gamePSMHighLevel>(blackboard.GetInt(definitions.HighLevel));
    swimmingState = IntEnum<gamePSMSwimming>(blackboard.GetInt(definitions.Swimming));
    if NotEquals(swimmingState, gamePSMSwimming.Default) {
      return CyberwareLoadoutResult.Create(CyberwareLoadoutResultCode.UnsafePlayerState, "游泳中禁止切换 / Switching is disabled while swimming");
    }
    if NotEquals(highLevelState, gamePSMHighLevel.Default)
      && NotEquals(highLevelState, gamePSMHighLevel.SceneTier1) {
      return CyberwareLoadoutResult.Create(CyberwareLoadoutResultCode.UnsafePlayerState, "剧情场景中禁止切换 / Switching is disabled in scene tiers");
    }
    if StatusEffectSystem.ObjectHasStatusEffect(player, t"BaseStatusEffect.PlayerInFinisherWorkspot") {
      return CyberwareLoadoutResult.Create(CyberwareLoadoutResultCode.UnsafePlayerState, "终结技工作点中禁止切换 / Switching is disabled in a finisher workspot");
    }

    timeDilationState = IntEnum<gamePSMTimeDilation>(blackboard.GetInt(definitions.TimeDilation));
    if NotEquals(timeDilationState, gamePSMTimeDilation.Default)
      || StatusEffectSystem.ObjectHasStatusEffectOfType(player, gamedataStatusEffectType.Sandevistan)
      || GameInstance.GetTimeSystem(player.GetGame()).IsTimeDilationActive(n"sandevistan")
      || StatusEffectSystem.ObjectHasStatusEffectOfType(player, gamedataStatusEffectType.Berserk)
      || StatusEffectSystem.ObjectHasStatusEffectWithTag(player, n"BerserkBuff")
      || StatusEffectSystem.ObjectHasStatusEffectWithTag(player, n"CamoActiveOnPlayer")
      || StatusEffectSystem.ObjectHasStatusEffectWithTag(player, n"OpticalCamoSlideCoolPerk")
      || StatusEffectSystem.ObjectHasStatusEffectWithTag(player, n"OpticalCamoGrapple")
      || StatusEffectSystem.ObjectHasStatusEffect(player, t"BaseStatusEffect.Intelligence_Central_Milestone_3_Overclock_Buff") {
      return CyberwareLoadoutResult.Create(CyberwareLoadoutResultCode.ActiveCyberwareEffect, "义体主动效果或时间膨胀生效中 / Active cyberware effect or time dilation");
    }

    transactionSystem = GameInstance.GetTransactionSystem(player.GetGame());
    itemID = transactionSystem.GetItemInSlot(player, t"AttachmentSlots.WeaponRight").GetItemID();
    if ItemID.IsValid(itemID) {
      itemRecord = TweakDBInterface.GetItemRecord(ItemID.GetTDBID(itemID));
      if IsDefined(itemRecord) && itemRecord.TagsContains(n"Meleeware") {
        return CyberwareLoadoutResult.Create(CyberwareLoadoutResultCode.CyberwareWeaponDrawn, "请先收起义体武器 / Holster arm cyberware first");
      }
    }

    itemID = transactionSystem.GetItemInSlot(player, t"AttachmentSlots.WeaponLeft").GetItemID();
    if ItemID.IsValid(itemID) {
      itemRecord = TweakDBInterface.GetItemRecord(ItemID.GetTDBID(itemID));
      if IsDefined(itemRecord) && itemRecord.TagsContains(n"ProjectileLauncher") {
        return CyberwareLoadoutResult.Create(CyberwareLoadoutResultCode.CyberwareWeaponDrawn, "请先收起义体武器 / Holster arm cyberware first");
      }
    }

    return CyberwareLoadoutResult.Create(CyberwareLoadoutResultCode.Success, "可以切换 / Ready");
  }

  private func ValidatePreset(
    player: ref<PlayerPuppet>,
    playerData: ref<EquipmentSystemPlayerData>,
    target: array<ref<CyberwareLoadoutEntry>>,
    current: array<ref<CyberwareLoadoutEntry>>
  ) -> ref<CyberwareLoadoutResult> {
    let transactionSystem = GameInstance.GetTransactionSystem(player.GetGame());
    let statsSystem = GameInstance.GetStatsSystem(player.GetGame());
    let itemData: wref<gameItemData>;
    let itemType: CName;
    let otherType: CName;
    let humanityCost: Float = 0.00;
    let humanityLimit: Float;
    let currentBooster: Float;
    let targetBooster: Float = 0.00;
    let capacityFreedBeforeBooster: Float = 0.00;
    let removingBooster: Bool;
    let i: Int32 = 0;
    let j: Int32;

    while i < ArraySize(target) {
      if !IsDefined(target[i]) {
        return CyberwareLoadoutResult.Create(CyberwareLoadoutResultCode.InvalidPreset, "预设数据已损坏；请重新保存 / Corrupt loadout entry; save again");
      }
      if !ItemID.IsValid(target[i].itemID) || !TDBID.IsValid(target[i].itemRecord) {
        return CyberwareLoadoutResult.Create(CyberwareLoadoutResultCode.MissingItem, "预设来自旧版本或物品标识无效；请重新保存 / Invalid item identity; save the loadout again");
      }
      itemData = transactionSystem.GetItemData(player, target[i].itemID);
      if !IsDefined(itemData) || !this.IsEquippableForTransition(player, playerData, itemData) {
        return CyberwareLoadoutResult.Create(CyberwareLoadoutResultCode.MissingItem, s"义体当前不可装备: \(target[i].itemRecord) / Cyberware is not equippable");
      }
      if !playerData.CWL_IsCyberwareArea(target[i].area) || NotEquals(EquipmentSystem.GetEquipAreaType(target[i].itemID), target[i].area) {
        return CyberwareLoadoutResult.Create(CyberwareLoadoutResultCode.InvalidItemArea, s"义体区域不匹配: \(target[i].itemRecord) / Equipment area mismatch");
      }
      if !playerData.CWL_IsSlotAvailable(target[i].area, target[i].slotIndex) {
        return CyberwareLoadoutResult.Create(CyberwareLoadoutResultCode.MissingSlot, s"预设槽位未解锁: \(target[i].area)[\(target[i].slotIndex)] / Slot unavailable");
      }

      j = 0;
      while j < i {
        if Equals(target[i].area, target[j].area) && target[i].slotIndex == target[j].slotIndex {
          return CyberwareLoadoutResult.Create(CyberwareLoadoutResultCode.MissingSlot, "预设包含重复槽位 / Duplicate slot in loadout");
        }
        if Equals(target[i].itemID, target[j].itemID) {
          return CyberwareLoadoutResult.Create(CyberwareLoadoutResultCode.MissingItem, "预设重复使用同一物品实例 / Duplicate item instance");
        }
        if Equals(target[i].area, target[j].area) {
          itemType = TweakDBInterface.GetCName(target[i].itemRecord + t".cyberwareType", n"None");
          otherType = TweakDBInterface.GetCName(target[j].itemRecord + t".cyberwareType", n"None");
          if NotEquals(itemType, n"None") && Equals(itemType, otherType) {
            return CyberwareLoadoutResult.Create(CyberwareLoadoutResultCode.ConflictingCyberware, "同一区域包含互斥义体类型 / Conflicting cyberware types");
          }
        }
        j += 1;
      }

      if !CyberwareLoadoutEntry.ContainsExact(current, target[i]) && itemData.HasTag(n"UnequipBlocked") {
        return CyberwareLoadoutResult.Create(CyberwareLoadoutResultCode.BlockedItem, "目标义体禁止卸载，无法保证回滚 / Target item cannot be safely rolled back");
      }

      j = 0;
      if ArraySize(target[i].parts) != ArraySize(target[i].partSlots) {
        return CyberwareLoadoutResult.Create(CyberwareLoadoutResultCode.InvalidPreset, "预设程序槽数据来自旧版本；请重新保存 / Program slot data is outdated; save again");
      }
      while j < ArraySize(target[i].parts) {
        if !ItemID.IsValid(target[i].parts[j]) || !TDBID.IsValid(target[i].partSlots[j]) {
          return CyberwareLoadoutResult.Create(CyberwareLoadoutResultCode.InvalidPreset, "预设中的义体系统插件标识无效；请重新保存 / Invalid saved cyberdeck program identity");
        }
        if this.HasEarlierProgramReference(target, i, j) {
          return CyberwareLoadoutResult.Create(CyberwareLoadoutResultCode.InvalidPreset, "预设重复使用程序实例或程序槽；请重新保存 / Duplicate cyberdeck program or slot");
        }
        j += 1;
      }

      humanityCost += this.GetEquipRequirement(player, itemData, gamedataStatType.HumanityAvailable);
      if itemData.HasTag(n"CapacityBooster") && !CyberwareLoadoutEntry.ContainsExact(current, target[i]) {
        targetBooster += itemData.GetStatValueByType(gamedataStatType.CapacityBoosterHumanity);
      }
      i += 1;
    }

    i = 0;
    while i < ArraySize(current) {
      if !CyberwareLoadoutEntry.ContainsExact(target, current[i]) {
        itemData = transactionSystem.GetItemData(player, current[i].itemID);
        if !IsDefined(itemData) || itemData.HasTag(n"UnequipBlocked") {
          return CyberwareLoadoutResult.Create(CyberwareLoadoutResultCode.BlockedItem, "当前义体禁止卸载 / Equipped item cannot be removed");
        }
        if itemData.HasTag(n"CapacityBooster") {
          removingBooster = true;
        } else {
          capacityFreedBeforeBooster += this.GetEquipRequirement(player, itemData, gamedataStatType.HumanityAvailable);
        }
      }
      i += 1;
    }

    currentBooster = statsSystem.GetStatValue(Cast<StatsObjectID>(player.GetEntityID()), gamedataStatType.CapacityBoosterHumanity);
    if removingBooster
      && statsSystem.GetStatValue(Cast<StatsObjectID>(player.GetEntityID()), gamedataStatType.HumanityAvailable) + capacityFreedBeforeBooster < currentBooster {
      return CyberwareLoadoutResult.Create(CyberwareLoadoutResultCode.CapacityExceeded, "当前容量不足以安全移除容量增幅义体 / Capacity booster removal is blocked");
    }

    humanityLimit = statsSystem.GetStatValue(Cast<StatsObjectID>(player.GetEntityID()), gamedataStatType.HumanityTotalMaxValue)
      - (removingBooster ? currentBooster : 0.00)
      + targetBooster;
    if humanityCost > humanityLimit + 0.01 {
      return CyberwareLoadoutResult.Create(CyberwareLoadoutResultCode.CapacityExceeded, s"义体容量不足: \(humanityCost)/\(humanityLimit) / Cyberware capacity exceeded");
    }

    return CyberwareLoadoutResult.Create(CyberwareLoadoutResultCode.Success, "预检通过 / Preflight passed");
  }

  private func HasEarlierProgramReference(
    target: array<ref<CyberwareLoadoutEntry>>,
    entryIndex: Int32,
    partIndex: Int32
  ) -> Bool {
    let i: Int32 = 0;
    let j: Int32;
    while i <= entryIndex {
      j = 0;
      while j < ArraySize(target[i].parts) {
        if i == entryIndex && j >= partIndex {
          break;
        }
        if Equals(target[i].parts[j], target[entryIndex].parts[partIndex])
          || (i == entryIndex && Equals(target[i].partSlots[j], target[entryIndex].partSlots[partIndex])) {
          return true;
        }
        j += 1;
      }
      i += 1;
    }
    return false;
  }

  private func IsEquippableForTransition(
    player: ref<PlayerPuppet>,
    playerData: ref<EquipmentSystemPlayerData>,
    itemData: wref<gameItemData>
  ) -> Bool {
    let requirements: array<SItemStackRequirementData>;
    let i: Int32 = 0;

    if playerData.IsEquippable(itemData) {
      return true;
    }
    if RPGManager.IsItemBroken(itemData) {
      return false;
    }
    if GameInstance.GetStatsSystem(player.GetGame()).GetStatValue(Cast<StatsObjectID>(player.GetEntityID()), gamedataStatType.Level)
      < Cast<Float>(FloorF(itemData.GetStatValueByType(gamedataStatType.Level))) {
      return false;
    }

    requirements = RPGManager.GetEquipRequirements(player, itemData);
    while i < ArraySize(requirements) {
      if NotEquals(requirements[i].statType, gamedataStatType.HumanityAvailable)
        && requirements[i].requiredValue > GameInstance.GetStatsSystem(player.GetGame()).GetStatValue(Cast<StatsObjectID>(player.GetEntityID()), requirements[i].statType) {
        return false;
      }
      i += 1;
    }
    return true;
  }

  private func GetEquipRequirement(player: ref<PlayerPuppet>, itemData: wref<gameItemData>, statType: gamedataStatType) -> Float {
    let requirements = RPGManager.GetEquipRequirements(player, itemData);
    let i: Int32 = ArraySize(requirements) - 1;
    while i >= 0 {
      if Equals(requirements[i].statType, statType) {
        return requirements[i].requiredValue;
      }
      i -= 1;
    }
    return 0.00;
  }

  private func QueueTransition(
    player: ref<PlayerPuppet>,
    current: array<ref<CyberwareLoadoutEntry>>,
    target: array<ref<CyberwareLoadoutEntry>>,
    rollback: Bool
  ) -> Void {
    let batchSystem = CyberwareLoadoutBatchSystem.GetInstance(player.GetGame());
    let request = new CyberwareLoadoutBatchRequest();
    request.owner = player;
    request.replySystem = this;
    request.token = this.switchToken;
    request.rollback = rollback;
    request.current = current;
    request.target = target;
    if IsDefined(batchSystem) {
      batchSystem.QueueRequest(request);
    } else {
      this.CompleteSwitch(CyberwareLoadoutResult.Create(CyberwareLoadoutResultCode.NoEquipmentData, "批量系统尚未就绪 / Batch system unavailable"));
    }
  }

  private func CompleteSwitch(result: ref<CyberwareLoadoutResult>) -> Void {
    let controller = this.activeController;
    this.switchInProgress = false;
    this.activePlayer = null;
    ArrayClear(this.activeBefore);
    ArrayClear(this.activeTarget);
    this.activeController = null;

    if IsDefined(controller) {
      controller.CWL_OnSwitchFinished(result);
    }
  }

  private func EntriesMatch(a: array<ref<CyberwareLoadoutEntry>>, b: array<ref<CyberwareLoadoutEntry>>) -> Bool {
    if ArraySize(a) != ArraySize(b) {
      return false;
    }
    for entry in a {
      if !CyberwareLoadoutEntry.ContainsExact(b, entry) {
        return false;
      }
    }
    return true;
  }
}
