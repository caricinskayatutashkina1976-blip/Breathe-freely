from enum import Enum


class EntityType(str, Enum):
    NAME = "NAME"
    BIRTH_DATE = "BIRTH_DATE"
    BIRTH_PLACE = "BIRTH_PLACE"
    ADDRESS = "ADDRESS"
    PHONE = "PHONE"
    EMAIL = "EMAIL"
    PASSPORT = "PASSPORT"
    SNILS = "SNILS"
    INN = "INN"
    DRIVER_LICENSE = "DRIVER_LICENSE"
    OMS_POLICY = "OMS_POLICY"
    BANK_CARD = "BANK_CARD"
    BANK_ACCOUNT = "BANK_ACCOUNT"
    IBAN = "IBAN"
    MEDICAL = "MEDICAL"
    NATIONALITY = "NATIONALITY"
    POLITICAL = "POLITICAL"
    RELIGION = "RELIGION"
    IP_ADDRESS = "IP_ADDRESS"
    MAC_ADDRESS = "MAC_ADDRESS"
    SESSION_TOKEN = "SESSION_TOKEN"
    PERSONAL_URL = "PERSONAL_URL"
    ORG = "ORG"
    LOCATION = "LOCATION"


ENTITY_152FZ_ARTICLE = {
    EntityType.NAME: "ст. 3, 6 152-ФЗ — идентификация субъекта",
    EntityType.BIRTH_DATE: "ст. 3 152-ФЗ — биографические данные",
    EntityType.BIRTH_PLACE: "ст. 3 152-ФЗ — биографические данные",
    EntityType.ADDRESS: "ст. 3 152-ФЗ — адресные данные",
    EntityType.PHONE: "ст. 3 152-ФЗ — контактные данные",
    EntityType.EMAIL: "ст. 3 152-ФЗ — контактные данные",
    EntityType.PASSPORT: "ст. 3 152-ФЗ — документ удостоверяющий личность",
    EntityType.SNILS: "ст. 3 152-ФЗ — страховой номер",
    EntityType.INN: "ст. 3 152-ФЗ — налоговый идентификатор",
    EntityType.DRIVER_LICENSE: "ст. 3 152-ФЗ — документ удостоверяющий личность",
    EntityType.OMS_POLICY: "ст. 3 152-ФЗ — медицинский идентификатор",
    EntityType.BANK_CARD: "ст. 3 152-ФЗ — финансовые данные",
    EntityType.BANK_ACCOUNT: "ст. 3 152-ФЗ — финансовые данные",
    EntityType.IBAN: "ст. 3 152-ФЗ — финансовые данные",
    EntityType.MEDICAL: "ст. 10 152-ФЗ — специальные категории (здоровье)",
    EntityType.NATIONALITY: "ст. 10 152-ФЗ — специальные категории",
    EntityType.POLITICAL: "ст. 10 152-ФЗ — специальные категории",
    EntityType.RELIGION: "ст. 10 152-ФЗ — специальные категории",
    EntityType.IP_ADDRESS: "ст. 3 152-ФЗ — цифровой идентификатор",
    EntityType.MAC_ADDRESS: "ст. 3 152-ФЗ — цифровой идентификатор",
    EntityType.SESSION_TOKEN: "ст. 3 152-ФЗ — цифровой идентификатор",
    EntityType.PERSONAL_URL: "ст. 3 152-ФЗ — цифровой идентификатор",
}
