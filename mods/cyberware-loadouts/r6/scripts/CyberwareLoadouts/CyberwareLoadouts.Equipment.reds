module CyberwareLoadoutsV3

@addMethod(EquipmentSystemPlayerData)
private final func CWL_PushUniqueID(out values: array<ItemID>, value: ItemID) -> Void {
  if ItemID.IsValid(value) && !ArrayContains(values, value) {
    ArrayPush(values, value);
  }
}

@addMethod(EquipmentSystemPlayerData)
private final func CWL_BuildCandidateIDs(
  player: ref<PlayerPuppet>,
  current: array<ref<CyberwareLoadoutEntry>>,
  out candidates: array<ItemID>
) -> Void {
  let itemList: array<wref<gameItemData>>;
  let transactionSystem = GameInstance.GetTransactionSystem(player.GetGame());
  let i: Int32 = 0;
  let j: Int32;
  ArrayClear(candidates);
  while i < ArraySize(current) {
    if IsDefined(current[i]) {
      this.CWL_PushUniqueID(candidates, current[i].itemID);
      j = 0;
      while j < ArraySize(current[i].parts) {
        this.CWL_PushUniqueID(candidates, current[i].parts[j]);
        j += 1;
      }
    }
    i += 1;
  }
  transactionSystem.GetItemList(player, itemList);
  i = 0;
  while i < ArraySize(itemList) {
    if IsDefined(itemList[i]) {
      this.CWL_PushUniqueID(candidates, itemList[i].GetID());
    }
    i += 1;
  }
}

@addMethod(EquipmentSystemPlayerData)
private final func CWL_ResolveCandidateID(
  candidates: array<ItemID>,
  used: array<ItemID>,
  reserved: array<ItemID>,
  wantedID: ItemID,
  wantedRecord: TweakDBID,
  wantedArea: gamedataEquipmentArea,
  checkArea: Bool,
  out resolvedID: ItemID,
  out ambiguous: Bool
) -> Bool {
  let candidate: ItemID;
  let fallback: ItemID;
  let count: Int32 = 0;
  let i: Int32 = 0;
  ambiguous = false;
  resolvedID = ItemID.None();

  // A Tech perk side-upgrade is a transient equipped record. Its stable
  // inventory identity is the owned backing item whose static record points
  // at the saved side record. Resolve that relation only during an explicit
  // Apply; passive capture must never inspect side-upgrade metadata.
  if checkArea && Equals(wantedArea, gamedataEquipmentArea.MusculoskeletalSystemCW) {
    while i < ArraySize(candidates) {
      candidate = candidates[i];
      if !ArrayContains(used, candidate)
        && !ArrayContains(reserved, candidate)
        && this.CWL_IsSideUpgradeBacking(candidate, wantedRecord, wantedArea) {
        fallback = candidate;
        count += 1;
      }
      i += 1;
    }
    if count == 1 {
      resolvedID = fallback;
      return true;
    }
    if count > 1 {
      ambiguous = true;
      return false;
    }
  }

  i = 0;
  while i < ArraySize(candidates) {
    candidate = candidates[i];
    if Equals(candidate, wantedID)
      && !ArrayContains(used, candidate)
      && Equals(ItemID.GetTDBID(candidate), wantedRecord)
      && (!checkArea || Equals(EquipmentSystem.GetEquipAreaType(candidate), wantedArea)) {
      resolvedID = candidate;
      return true;
    }
    i += 1;
  }
  i = 0;
  while i < ArraySize(candidates) {
    candidate = candidates[i];
    if !ArrayContains(used, candidate)
      && !ArrayContains(reserved, candidate)
      && Equals(ItemID.GetTDBID(candidate), wantedRecord)
      && (!checkArea || Equals(EquipmentSystem.GetEquipAreaType(candidate), wantedArea)) {
      fallback = candidate;
      count += 1;
    }
    i += 1;
  }
  if count == 1 {
    resolvedID = fallback;
    return true;
  }
  ambiguous = count > 1;
  return false;
}

@addMethod(EquipmentSystemPlayerData)
public final func CWL_ResolveEntries(
  player: ref<PlayerPuppet>,
  source: array<ref<CyberwareLoadoutEntry>>,
  current: array<ref<CyberwareLoadoutEntry>>,
  stage: String,
  out resolved: array<ref<CyberwareLoadoutEntry>>
) -> ref<CyberwareLoadoutResult> {
  let ambiguous: Bool;
  let candidate: ItemID;
  let candidates: array<ItemID>;
  let emptyParts: array<ItemID>;
  let entry: ref<CyberwareLoadoutEntry>;
  let installedPart: InnerItemData;
  let itemData: wref<gameItemData>;
  let partID: ItemID;
  let partRecord: TweakDBID;
  let seenSourceItems: array<ItemID>;
  let seenSourcePrograms: array<ItemID>;
  let seenSlots: array<TweakDBID>;
  let transactionSystem = GameInstance.GetTransactionSystem(player.GetGame());
  let reserved: array<ItemID>;
  let used: array<ItemID>;
  let i: Int32 = 0;
  let j: Int32;
  let k: Int32;

  ArrayClear(resolved);
  this.CWL_BuildCandidateIDs(player, current, candidates);
  while i < ArraySize(source) {
    if !IsDefined(source[i])
      || !TDBID.IsValid(source[i].itemRecord)
      || !this.CWL_IsCyberwareArea(source[i].area)
      || ArraySize(source[i].parts) != ArraySize(source[i].partSlots) {
      return CyberwareLoadoutResult.Create(CyberwareLoadoutResultCode.InvalidPreset, "预设数据已损坏；请重新保存 / Corrupt loadout data; save again");
    }
    if ItemID.IsValid(source[i].itemID) && ArrayContains(seenSourceItems, source[i].itemID) {
      return CyberwareLoadoutResult.Create(CyberwareLoadoutResultCode.InvalidPreset, "预设重复引用同一义体实例 / Duplicate saved cyberware instance");
    }
    if ItemID.IsValid(source[i].itemID) {
      ArrayPush(seenSourceItems, source[i].itemID);
    }
    k = 0;
    while k < ArraySize(candidates) {
      candidate = candidates[k];
      if Equals(candidate, source[i].itemID)
        && Equals(ItemID.GetTDBID(candidate), source[i].itemRecord)
        && Equals(EquipmentSystem.GetEquipAreaType(candidate), source[i].area) {
        this.CWL_PushUniqueID(reserved, candidate);
        break;
      }
      k += 1;
    }
    i += 1;
  }

  i = 0;
  while i < ArraySize(source) {
    if !this.CWL_ResolveCandidateID(candidates, used, reserved, source[i].itemID, source[i].itemRecord, source[i].area, true, partID, ambiguous) {
      if ambiguous {
        return CyberwareLoadoutResult.Create(CyberwareLoadoutResultCode.AmbiguousItem, s"存在多个同记录义体，无法安全确定实例: \(TDBID.ToStringDEBUG(source[i].itemRecord)) / Ambiguous cyberware instance");
      }
      return CyberwareLoadoutResult.Create(CyberwareLoadoutResultCode.MissingItem, s"缺少预设中的义体记录: \(TDBID.ToStringDEBUG(source[i].itemRecord)) / Missing saved cyberware record");
    }
    if ArrayContains(used, partID) {
      return CyberwareLoadoutResult.Create(CyberwareLoadoutResultCode.InvalidPreset, "预设重复引用同一基础义体 / Duplicate backing cyberware instance");
    }
    ArrayPush(used, partID);
    entry = CyberwareLoadoutEntry.Create(source[i].area, source[i].slotIndex, partID, emptyParts, source[i].partSlots);
    ArrayPush(resolved, entry);

    itemData = transactionSystem.GetItemData(player, partID);
    j = 0;
    while IsDefined(itemData) && j < ArraySize(source[i].partSlots) {
      itemData.GetItemPart(installedPart, source[i].partSlots[j]);
      this.CWL_PushUniqueID(candidates, InnerItemData.GetItemID(installedPart));
      j += 1;
    }
    i += 1;
  }

  i = 0;
  while i < ArraySize(source) {
    ArrayClear(seenSlots);
    j = 0;
    while j < ArraySize(source[i].parts) {
      if !ItemID.IsValid(source[i].parts[j]) || !TDBID.IsValid(source[i].partSlots[j]) {
        return CyberwareLoadoutResult.Create(CyberwareLoadoutResultCode.InvalidPreset, "预设程序标识无效；请重新保存 / Invalid saved program identity");
      }
      if ArrayContains(seenSourcePrograms, source[i].parts[j]) || ArrayContains(seenSlots, source[i].partSlots[j]) {
        return CyberwareLoadoutResult.Create(CyberwareLoadoutResultCode.InvalidPreset, "预设重复引用程序实例或程序槽 / Duplicate saved program or slot");
      }
      ArrayPush(seenSourcePrograms, source[i].parts[j]);
      ArrayPush(seenSlots, source[i].partSlots[j]);
      partRecord = ItemID.GetTDBID(source[i].parts[j]);
      if !TDBID.IsValid(partRecord) {
        return CyberwareLoadoutResult.Create(CyberwareLoadoutResultCode.InvalidPreset, "预设程序记录无效；请重新保存 / Invalid saved program record");
      }
      k = 0;
      while k < ArraySize(candidates) {
        candidate = candidates[k];
        if Equals(candidate, source[i].parts[j]) && Equals(ItemID.GetTDBID(candidate), partRecord) {
          this.CWL_PushUniqueID(reserved, candidate);
          break;
        }
        k += 1;
      }
      j += 1;
    }
    i += 1;
  }

  i = 0;
  while i < ArraySize(source) {
    j = 0;
    while j < ArraySize(source[i].parts) {
      partRecord = ItemID.GetTDBID(source[i].parts[j]);
      if !this.CWL_ResolveCandidateID(candidates, used, reserved, source[i].parts[j], partRecord, gamedataEquipmentArea.Invalid, false, partID, ambiguous) {
        if ambiguous {
          return CyberwareLoadoutResult.Create(CyberwareLoadoutResultCode.AmbiguousItem, s"存在多个同记录程序，无法安全确定实例: \(TDBID.ToStringDEBUG(partRecord)) / Ambiguous cyberdeck program");
        }
        return CyberwareLoadoutResult.Create(CyberwareLoadoutResultCode.MissingItem, s"缺少预设中的义体系统插件: \(TDBID.ToStringDEBUG(partRecord)) / Missing saved cyberdeck program");
      }
      ArrayPush(used, partID);
      ArrayPush(resolved[i].parts, partID);
      j += 1;
    }
    i += 1;
  }
  return CyberwareLoadoutResult.Create(CyberwareLoadoutResultCode.Success, "实例解析完成 / Instances resolved", ArraySize(resolved));
}

@addMethod(EquipmentSystemPlayerData)
public final func CWL_IsCyberwareArea(area: gamedataEquipmentArea) -> Bool {
  switch area {
    case gamedataEquipmentArea.ArmsCW:
    case gamedataEquipmentArea.CardiovascularSystemCW:
    case gamedataEquipmentArea.EyesCW:
    case gamedataEquipmentArea.FrontalCortexCW:
    case gamedataEquipmentArea.HandsCW:
    case gamedataEquipmentArea.IntegumentarySystemCW:
    case gamedataEquipmentArea.LegsCW:
    case gamedataEquipmentArea.MusculoskeletalSystemCW:
    case gamedataEquipmentArea.NervousSystemCW:
    case gamedataEquipmentArea.SystemReplacementCW:
      return true;
  }

  return false;
}

@addMethod(EquipmentSystemPlayerData)
private final func CWL_IsSideUpgradeBacking(
  candidate: ItemID,
  sideRecord: TweakDBID,
  area: gamedataEquipmentArea
) -> Bool {
  let itemRecord: wref<Item_Record>;
  let sideUpgrade: wref<Item_Record>;
  if !ItemID.IsValid(candidate)
    || !TDBID.IsValid(sideRecord)
    || NotEquals(area, gamedataEquipmentArea.MusculoskeletalSystemCW)
    || NotEquals(EquipmentSystem.GetEquipAreaType(candidate), area) {
    return false;
  }
  itemRecord = TweakDBInterface.GetItemRecord(ItemID.GetTDBID(candidate));
  if !IsDefined(itemRecord) {
    return false;
  }
  sideUpgrade = itemRecord.SideUpgradeItem();
  return IsDefined(sideUpgrade) && Equals(sideUpgrade.GetID(), sideRecord);
}

@addMethod(EquipmentSystemPlayerData)
public final func CWL_CaptureCyberware(player: ref<PlayerPuppet>, out entries: array<ref<CyberwareLoadoutEntry>>) -> ref<CyberwareLoadoutResult> {
  let areaIndex: Int32 = 0;
  let slotIndex: Int32;
  let itemID: ItemID;
  let area: gamedataEquipmentArea;
  let parts: array<ItemID>;
  let partSlots: array<TweakDBID>;

  ArrayClear(entries);

  while areaIndex < ArraySize(this.m_equipment.equipAreas) {
    area = this.m_equipment.equipAreas[areaIndex].areaType;
    if this.CWL_IsCyberwareArea(area) {
      slotIndex = 0;
      while slotIndex < ArraySize(this.m_equipment.equipAreas[areaIndex].equipSlots) {
        itemID = this.m_equipment.equipAreas[areaIndex].equipSlots[slotIndex].itemID;
        if ItemID.IsValid(itemID) {
          this.CWL_CaptureParts(player, itemID, parts, partSlots);
          ArrayPush(entries, CyberwareLoadoutEntry.Create(area, slotIndex, itemID, parts, partSlots));
        }
        slotIndex += 1;
      }
    }
    areaIndex += 1;
  }

  return CyberwareLoadoutResult.Create(CyberwareLoadoutResultCode.Success, "义体快照已捕获 / Cyberware snapshot captured", ArraySize(entries));
}

@addMethod(EquipmentSystemPlayerData)
public final func CWL_CaptureParts(
  player: ref<PlayerPuppet>,
  itemID: ItemID,
  out parts: array<ItemID>,
  out partSlots: array<TweakDBID>
) -> Void {
  let itemData: wref<gameItemData>;
  let partData: InnerItemData;
  let partID: ItemID;
  let staticData: wref<Item_Record>;
  let transactionSystem: ref<TransactionSystem>;
  let usedSlots: array<TweakDBID>;
  let i: Int32 = 0;

  ArrayClear(parts);
  ArrayClear(partSlots);
  if !EquipmentSystem.IsItemCyberdeck(itemID) {
    return;
  }

  transactionSystem = GameInstance.GetTransactionSystem(player.GetGame());
  itemData = transactionSystem.GetItemData(player, itemID);
  if !IsDefined(itemData) {
    return;
  }

  transactionSystem.GetUsedSlotsOnItem(player, itemID, usedSlots);
  while i < ArraySize(usedSlots) {
    if NotEquals(usedSlots[i], t"AttachmentSlots.StatsShardSlot") {
      itemData.GetItemPart(partData, usedSlots[i]);
      staticData = InnerItemData.GetStaticData(partData);
      partID = InnerItemData.GetItemID(partData);
      if IsDefined(staticData) && !staticData.TagsContains(n"DummyPart") && ItemID.IsValid(partID) {
        ArrayPush(parts, partID);
        ArrayPush(partSlots, usedSlots[i]);
      }
    }
    i += 1;
  }
}

@addMethod(EquipmentSystemPlayerData)
public final func CWL_GetSlotCount(area: gamedataEquipmentArea) -> Int32 {
  let areaIndex = this.GetEquipAreaIndex(area);
  if areaIndex < 0 || areaIndex >= ArraySize(this.m_equipment.equipAreas) {
    return 0;
  }

  return ArraySize(this.m_equipment.equipAreas[areaIndex].equipSlots);
}

@addMethod(EquipmentSystemPlayerData)
public final func CWL_GetItemAt(area: gamedataEquipmentArea, slotIndex: Int32) -> ItemID {
  if slotIndex < 0 || slotIndex >= this.CWL_GetSlotCount(area) {
    return ItemID.None();
  }
  return this.GetItemInEquipSlot(area, slotIndex);
}

@addMethod(EquipmentSystemPlayerData)
public final func CWL_IsSlotAvailable(area: gamedataEquipmentArea, slotIndex: Int32) -> Bool {
  let visibleWhenLocked: Bool;
  if slotIndex < 0 || slotIndex >= this.CWL_GetSlotCount(area) {
    return false;
  }
  return !this.IsSlotLocked(area, slotIndex, visibleWhenLocked);
}

@addMethod(EquipmentSystemPlayerData)
public final func CWL_RestoreParts(player: ref<PlayerPuppet>, entry: ref<CyberwareLoadoutEntry>) -> Void {
  let transactionSystem: ref<TransactionSystem>;
  let availableSlots: array<TweakDBID>;
  let installedPart: InnerItemData;
  let itemData: wref<gameItemData>;
  let i: Int32 = 0;

  if !IsDefined(entry) || !this.IsEquipped(entry.itemID) || ArraySize(entry.parts) != ArraySize(entry.partSlots) {
    return;
  }

  transactionSystem = GameInstance.GetTransactionSystem(player.GetGame());
  transactionSystem.GetAvailableSlotsOnItem(player, entry.itemID, availableSlots);
  itemData = transactionSystem.GetItemData(player, entry.itemID);
  while i < ArraySize(entry.parts) {
    if IsDefined(itemData)
      && ItemID.IsValid(entry.parts[i])
      && TDBID.IsValid(entry.partSlots[i])
      && ArrayContains(availableSlots, entry.partSlots[i])
      && transactionSystem.HasItem(player, entry.parts[i]) {
      transactionSystem.AddPart(player, entry.itemID, entry.parts[i], entry.partSlots[i]);
      itemData.GetItemPart(installedPart, entry.partSlots[i]);
      if Equals(InnerItemData.GetItemID(installedPart), entry.parts[i]) {
        this.ApplyEquipGLPs(entry.parts[i]);
      }
    }
    i += 1;
  }
}
