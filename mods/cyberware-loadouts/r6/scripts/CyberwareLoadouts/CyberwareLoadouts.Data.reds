module CyberwareLoadoutsV3

public enum CyberwareLoadoutResultCode {
  Success = 0,
  InvalidPreset = 1,
  EmptyPreset = 2,
  NoPlayer = 3,
  NoEquipmentData = 4,
  InCombat = 5,
  PlayerUnavailable = 6,
  InVehicle = 7,
  UnsafePlayerState = 8,
  ActiveCyberwareEffect = 9,
  CyberwareOnCooldown = 10,
  CyberwareWeaponDrawn = 11,
  MissingItem = 12,
  MissingSlot = 13,
  EquipFailed = 14,
  RollbackFailed = 15,
  SwitchStarted = 16,
  Busy = 17,
  BlockedItem = 18,
  CapacityExceeded = 19,
  ConflictingCyberware = 20,
  InvalidItemArea = 21,
  EmptyCapture = 22,
  AmbiguousItem = 23
}

public class CyberwareLoadoutEntry extends IScriptable {
  public let area: gamedataEquipmentArea;
  public let slotIndex: Int32;
  public let itemID: ItemID;
  public let itemRecord: TweakDBID;
  public let parts: array<ItemID>;
  public let partSlots: array<TweakDBID>;

  public static func Create(
    area: gamedataEquipmentArea,
    slotIndex: Int32,
    itemID: ItemID,
    parts: array<ItemID>,
    partSlots: array<TweakDBID>
  ) -> ref<CyberwareLoadoutEntry> {
    let entry = new CyberwareLoadoutEntry();
    entry.area = area;
    entry.slotIndex = slotIndex;
    entry.itemID = itemID;
    entry.itemRecord = ItemID.GetTDBID(itemID);
    entry.parts = parts;
    entry.partSlots = partSlots;
    return entry;
  }

  public static func Matches(a: ref<CyberwareLoadoutEntry>, b: ref<CyberwareLoadoutEntry>) -> Bool {
    let i: Int32 = 0;
    if !IsDefined(a) || !IsDefined(b)
      || NotEquals(a.area, b.area)
      || a.slotIndex != b.slotIndex
      || !CyberwareLoadoutEntry.ItemIdentityMatches(a, b)
      || ArraySize(a.parts) != ArraySize(b.parts)
      || ArraySize(a.partSlots) != ArraySize(b.partSlots)
      || ArraySize(a.parts) != ArraySize(a.partSlots) {
      return false;
    }
    while i < ArraySize(a.parts) {
      if NotEquals(a.parts[i], b.parts[i]) || NotEquals(a.partSlots[i], b.partSlots[i]) {
        return false;
      }
      i += 1;
    }
    return true;
  }

  private static func ItemIdentityMatches(a: ref<CyberwareLoadoutEntry>, b: ref<CyberwareLoadoutEntry>) -> Bool {
    let itemRecord: wref<Item_Record>;
    let sideUpgrade: wref<Item_Record>;
    if Equals(a.itemID, b.itemID) {
      return true;
    }
    if NotEquals(a.area, gamedataEquipmentArea.MusculoskeletalSystemCW) {
      return false;
    }

    itemRecord = TweakDBInterface.GetItemRecord(a.itemRecord);
    if IsDefined(itemRecord) {
      sideUpgrade = itemRecord.SideUpgradeItem();
      if IsDefined(sideUpgrade) && Equals(sideUpgrade.GetID(), b.itemRecord) {
        return true;
      }
    }

    itemRecord = TweakDBInterface.GetItemRecord(b.itemRecord);
    if IsDefined(itemRecord) {
      sideUpgrade = itemRecord.SideUpgradeItem();
      if IsDefined(sideUpgrade) && Equals(sideUpgrade.GetID(), a.itemRecord) {
        return true;
      }
    }
    return false;
  }

  public static func ContainsExact(entries: array<ref<CyberwareLoadoutEntry>>, wanted: ref<CyberwareLoadoutEntry>) -> Bool {
    for entry in entries {
      if CyberwareLoadoutEntry.Matches(entry, wanted) {
        return true;
      }
    }
    return false;
  }

  public static func ArraysMatch(a: array<ref<CyberwareLoadoutEntry>>, b: array<ref<CyberwareLoadoutEntry>>) -> Bool {
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

  public static func ContainsProgram(entries: array<ref<CyberwareLoadoutEntry>>, programID: ItemID) -> Bool {
    for entry in entries {
      if IsDefined(entry) && ArrayContains(entry.parts, programID) {
        return true;
      }
    }
    return false;
  }
}

public class CyberwareLoadoutPreset extends IScriptable {
  public let initialized: Bool;
  public let entries: array<ref<CyberwareLoadoutEntry>>;
}

public class CyberwareLoadoutBatchRequest extends ScriptableSystemRequest {
  public let owner: wref<GameObject>;
  public let replySystem: wref<CyberwareLoadoutSystem>;
  public let token: Int32;
  public let rollback: Bool;
  public let current: array<ref<CyberwareLoadoutEntry>>;
  public let target: array<ref<CyberwareLoadoutEntry>>;
}

public class CyberwareLoadoutBatchCompleteRequest extends ScriptableSystemRequest {
  public let token: Int32;
  public let rollback: Bool;
  public let blocked: Bool;
  public let mutated: Bool;
  public let blockedCode: CyberwareLoadoutResultCode;
  public let blockedDetail: String;
  public let observed: array<ref<CyberwareLoadoutEntry>>;
  public let expected: array<ref<CyberwareLoadoutEntry>>;
}

public class CyberwareLoadoutResult extends IScriptable {
  public let code: CyberwareLoadoutResultCode;
  public let detail: String;
  public let itemCount: Int32;

  public static func Create(code: CyberwareLoadoutResultCode, detail: String, opt itemCount: Int32) -> ref<CyberwareLoadoutResult> {
    let result = new CyberwareLoadoutResult();
    result.code = code;
    result.detail = detail;
    result.itemCount = itemCount;
    return result;
  }

  public func IsSuccess() -> Bool {
    return Equals(this.code, CyberwareLoadoutResultCode.Success);
  }

  public func IsStarted() -> Bool {
    return Equals(this.code, CyberwareLoadoutResultCode.SwitchStarted);
  }
}
