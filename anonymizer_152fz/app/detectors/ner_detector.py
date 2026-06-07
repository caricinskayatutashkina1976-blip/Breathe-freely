from app.detectors.base import BaseDetector, DetectedEntity
from app.models.entity_types import EntityType

_natasha_segmenter = None
_natasha_ner = None
_spacy_nlp = None


_morph_tagger = None


def _init_natasha():
    global _natasha_segmenter, _natasha_ner, _morph_tagger
    if _natasha_segmenter is not None:
        return True
    try:
        from natasha import MorphVocab, NewsEmbedding, NewsMorphTagger, NewsNERTagger, Segmenter

        _natasha_segmenter = Segmenter()
        emb = NewsEmbedding()
        morph_vocab = MorphVocab()
        _morph_tagger = NewsMorphTagger(emb)
        _natasha_ner = NewsNERTagger(emb)
        _init_natasha._morph_vocab = morph_vocab
        return True
    except Exception:
        return False


def _init_spacy(model_name: str):
    global _spacy_nlp
    if _spacy_nlp is not None:
        return True
    try:
        import spacy

        _spacy_nlp = spacy.load(model_name)
        return True
    except Exception:
        return False


class NERDetector(BaseDetector):
    name = "ner_natasha"

    ENTITY_MAP = {
        "PER": EntityType.NAME,
        "LOC": EntityType.ADDRESS,
        "ORG": EntityType.ORG,
    }

    def __init__(self, enable_natasha: bool = True, enable_spacy: bool = False, spacy_model: str = "ru_core_news_lg"):
        self._natasha_ok = enable_natasha and _init_natasha()
        self._spacy_ok = enable_spacy and _init_spacy(spacy_model)

    def detect(self, text: str) -> list[DetectedEntity]:
        results: list[DetectedEntity] = []
        if self._natasha_ok:
            results.extend(self._detect_natasha(text))
        if self._spacy_ok:
            results.extend(self._detect_spacy(text))
        return results

    def _detect_natasha(self, text: str) -> list[DetectedEntity]:
        from natasha import Doc

        doc = Doc(text)
        doc.segment(_natasha_segmenter)
        doc.tag_morph(_morph_tagger)
        doc.tag_ner(_natasha_ner)

        results = []
        for span in doc.spans:
            entity_type = self.ENTITY_MAP.get(span.type)
            if not entity_type:
                continue
            results.append(
                DetectedEntity(
                    start=span.start,
                    end=span.stop,
                    entity_type=entity_type,
                    value=span.text,
                    confidence=0.94,
                    detector_name=self.name,
                )
            )
        return results

    def _detect_spacy(self, text: str) -> list[DetectedEntity]:
        doc = _spacy_nlp(text)
        mapping = {"PER": EntityType.NAME, "LOC": EntityType.ADDRESS, "ORG": EntityType.ORG}
        results = []
        for ent in doc.ents:
            entity_type = mapping.get(ent.label_)
            if not entity_type:
                continue
            results.append(
                DetectedEntity(
                    start=ent.start_char,
                    end=ent.end_char,
                    entity_type=entity_type,
                    value=ent.text,
                    confidence=0.90,
                    detector_name="ner_spacy",
                )
            )
        return results
