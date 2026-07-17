import 'dart:ui';

import 'package:flutter/foundation.dart';
import 'package:google_mlkit_digital_ink_recognition/google_mlkit_digital_ink_recognition.dart';

/// A single drawn stroke: points plus their capture timestamps (ms).
class InkStroke {
  final List<Offset> points;
  final List<int> timesMs;
  const InkStroke(this.points, this.timesMs);
}

/// On-device handwriting recognition via ML Kit Digital Ink.
/// Supported here: English ('en-US') and Amharic ('am' — Ethiopic script).
/// Each language needs a one-time model download (~20 MB).
class HandwritingService {
  HandwritingService._();

  static const String english = 'en-US';
  static const String amharic = 'am';

  static final DigitalInkRecognizerModelManager _models =
      DigitalInkRecognizerModelManager();
  static final Map<String, DigitalInkRecognizer> _recognizers = {};
  static final Map<String, bool> _readyCache = {};

  static Future<bool> isModelReady(String lang) async {
    if (_readyCache[lang] == true) return true;
    try {
      final ready = await _models.isModelDownloaded(lang);
      if (ready) _readyCache[lang] = true;
      return ready;
    } catch (e) {
      debugPrint('HandwritingService: model check failed: $e');
      return false;
    }
  }

  static Future<bool> downloadModel(String lang) async {
    try {
      final ok = await _models.downloadModel(lang);
      if (ok) _readyCache[lang] = true;
      return ok;
    } catch (e) {
      debugPrint('HandwritingService: model download failed: $e');
      return false;
    }
  }

  /// Recognize the drawn strokes; returns candidate texts, best first.
  /// [writingArea] (the canvas size) helps the recognizer normalize scale.
  static Future<List<String>> recognize(
    String lang,
    List<InkStroke> strokes, {
    Size? writingArea,
    String preContext = '',
  }) async {
    if (strokes.isEmpty) return [];
    try {
      final recognizer = _recognizers.putIfAbsent(
          lang, () => DigitalInkRecognizer(languageCode: lang));

      final ink = Ink()
        ..strokes = strokes.map((s) {
          final stroke = Stroke();
          stroke.points = [
            for (var i = 0; i < s.points.length; i++)
              StrokePoint(
                x: s.points[i].dx,
                y: s.points[i].dy,
                t: s.timesMs[i],
              ),
          ];
          return stroke;
        }).toList();

      final context = DigitalInkRecognitionContext(
        preContext: preContext,
        writingArea: writingArea == null
            ? null
            : WritingArea(
                width: writingArea.width, height: writingArea.height),
      );

      final candidates =
          await recognizer.recognize(ink, context: context);
      return candidates.map((c) => c.text).toList();
    } catch (e) {
      debugPrint('HandwritingService: recognize failed: $e');
      return [];
    }
  }
}
