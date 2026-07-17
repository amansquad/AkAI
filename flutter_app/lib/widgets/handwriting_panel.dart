import 'dart:async';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/keyboard_provider.dart';
import '../providers/theme_provider.dart';
import '../app/theme/app_theme.dart';
import '../services/handwriting_service.dart';

class HandwritingPanel extends StatefulWidget {
  const HandwritingPanel({super.key});

  @override
  State<HandwritingPanel> createState() => _HandwritingPanelState();
}

enum _ModelState { checking, missing, downloading, ready, failed }

class _HandwritingPanelState extends State<HandwritingPanel> {
  final GlobalKey _canvasKey = GlobalKey();

  final List<InkStroke> _strokes = [];
  final List<InkStroke> _redoStack = [];
  List<Offset> _currentPoints = [];
  List<int> _currentTimes = [];

  double _strokeWidth = 4.0;
  Color _strokeColor = Colors.white;
  bool _autoRecognize = true;
  bool _isRecognizing = false;
  List<String> _suggestions = [];
  Timer? _recognizeTimer;

  String _lang = HandwritingService.english;
  _ModelState _modelState = _ModelState.checking;

  @override
  void initState() {
    super.initState();
    final provider = context.read<KeyboardProvider>();
    _lang = provider.language == KeyboardLanguage.amharic
        ? HandwritingService.amharic
        : HandwritingService.english;
    _checkModel();
  }

  Future<void> _checkModel() async {
    setState(() => _modelState = _ModelState.checking);
    final ready = await HandwritingService.isModelReady(_lang);
    if (!mounted) return;
    setState(() => _modelState = ready ? _ModelState.ready : _ModelState.missing);
  }

  Future<void> _downloadModel() async {
    setState(() => _modelState = _ModelState.downloading);
    final ok = await HandwritingService.downloadModel(_lang);
    if (!mounted) return;
    setState(() => _modelState = ok ? _ModelState.ready : _ModelState.failed);
  }

  void _setLanguage(String lang) {
    if (_lang == lang) return;
    setState(() {
      _lang = lang;
      _suggestions = [];
    });
    _checkModel();
  }

  RenderBox? get _canvasBox =>
      _canvasKey.currentContext?.findRenderObject() as RenderBox?;

  void _onPanStart(DragStartDetails details) {
    final box = _canvasBox;
    if (box == null || _modelState != _ModelState.ready) return;
    _recognizeTimer?.cancel();
    setState(() {
      _currentPoints = [box.globalToLocal(details.globalPosition)];
      _currentTimes = [DateTime.now().millisecondsSinceEpoch];
    });
  }

  void _onPanUpdate(DragUpdateDetails details) {
    final box = _canvasBox;
    if (box == null || _currentPoints.isEmpty) return;
    setState(() {
      _currentPoints.add(box.globalToLocal(details.globalPosition));
      _currentTimes.add(DateTime.now().millisecondsSinceEpoch);
    });
  }

  void _onPanEnd(DragEndDetails details) {
    if (_currentPoints.isEmpty) return;
    setState(() {
      _strokes.add(InkStroke(
          List<Offset>.from(_currentPoints), List<int>.from(_currentTimes)));
      _redoStack.clear();
      _currentPoints = [];
      _currentTimes = [];
    });

    if (_autoRecognize) {
      _recognizeTimer?.cancel();
      _recognizeTimer = Timer(const Duration(milliseconds: 700), () {
        if (mounted && _strokes.isNotEmpty) _recognize();
      });
    }
  }

  Future<void> _recognize() async {
    if (_strokes.isEmpty || _modelState != _ModelState.ready) return;
    setState(() => _isRecognizing = true);
    final area = _canvasBox?.size;
    final results = await HandwritingService.recognize(
      _lang,
      List<InkStroke>.from(_strokes),
      writingArea: area,
    );
    if (!mounted) return;
    setState(() {
      _isRecognizing = false;
      _suggestions = results.take(6).toList();
    });
  }

  void _undo() {
    if (_strokes.isEmpty) return;
    setState(() {
      _redoStack.add(_strokes.removeLast());
      _suggestions = [];
    });
    if (_autoRecognize && _strokes.isNotEmpty) _recognize();
  }

  void _redo() {
    if (_redoStack.isEmpty) return;
    setState(() => _strokes.add(_redoStack.removeLast()));
    if (_autoRecognize) _recognize();
  }

  void _clearCanvas() {
    _recognizeTimer?.cancel();
    setState(() {
      _strokes.clear();
      _redoStack.clear();
      _currentPoints = [];
      _currentTimes = [];
      _suggestions = [];
    });
  }

  void _insertSuggestion(String s) {
    context.read<KeyboardProvider>().appendText(s);
    _clearCanvas();
  }

  @override
  void dispose() {
    _recognizeTimer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = context.watch<ThemeProvider>().currentTheme;
    final isMatrix = theme.name == 'Matrix';
    final sc = isMatrix ? const Color(0xFF00FF41) : _strokeColor;

    return SizedBox(
      height: 340,
      child: Container(
        decoration: BoxDecoration(
          color: theme.background,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
        ),
        child: Column(children: [
          _header(theme),
          _tools(theme, sc),
          _buildSuggestions(theme, sc),
          Expanded(
              child: _modelState == _ModelState.ready
                  ? _canvas(theme, sc, isMatrix)
                  : _modelGate(theme)),
        ]),
      ),
    );
  }

  Widget _header(AkaiPalette theme) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      child: Row(children: [
        Container(
          padding: const EdgeInsets.all(6),
          decoration: BoxDecoration(
              color: theme.accent.withValues(alpha: 0.2),
              borderRadius: BorderRadius.circular(8)),
          child: Icon(Icons.draw, color: theme.accent, size: 16),
        ),
        const SizedBox(width: 8),
        Text('HANDWRITING',
            style: TextStyle(
                color: theme.accent,
                fontSize: 10,
                fontWeight: FontWeight.w800,
                letterSpacing: 1.5)),
        const SizedBox(width: 10),
        _langChip('EN', HandwritingService.english, theme),
        const SizedBox(width: 4),
        _langChip('አማ', HandwritingService.amharic, theme),
        const Spacer(),
        _iconBtn(Icons.undo, theme, _strokes.isNotEmpty ? _undo : null),
        const SizedBox(width: 8),
        _iconBtn(Icons.redo, theme, _redoStack.isNotEmpty ? _redo : null),
        const SizedBox(width: 8),
        _iconBtn(Icons.delete_outline, theme,
            _strokes.isNotEmpty ? _clearCanvas : null),
        const SizedBox(width: 8),
        _iconBtn(
            Icons.keyboard_return,
            theme,
            () => context
                .read<KeyboardProvider>()
                .setMode(KeyboardMode.keyboard)),
      ]),
    );
  }

  Widget _langChip(String label, String lang, AkaiPalette theme) {
    final selected = _lang == lang;
    return GestureDetector(
      onTap: () => _setLanguage(lang),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
        decoration: BoxDecoration(
            color: selected
                ? theme.accent.withValues(alpha: 0.25)
                : Colors.transparent,
            borderRadius: BorderRadius.circular(10),
            border: Border.all(
                color: selected
                    ? theme.accent
                    : theme.accent.withValues(alpha: 0.25))),
        child: Text(label,
            style: TextStyle(
                color: selected
                    ? theme.accent
                    : theme.keySecondaryText.withValues(alpha: 0.7),
                fontSize: 10,
                fontWeight: FontWeight.w800)),
      ),
    );
  }

  Widget _tools(AkaiPalette theme, Color sc) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
          color: theme.surface.withValues(alpha: 0.1),
          border: Border(
              top: BorderSide(color: theme.accent.withValues(alpha: 0.1)),
              bottom: BorderSide(color: theme.accent.withValues(alpha: 0.1)))),
      child: Row(children: [
        ...[2.0, 4.0, 6.0, 8.0].map((w) {
          final sel = _strokeWidth == w;
          return GestureDetector(
            onTap: () => setState(() => _strokeWidth = w),
            child: Container(
                width: 24,
                height: 24,
                margin: const EdgeInsets.only(right: 6),
                decoration: BoxDecoration(
                    color: sel
                        ? theme.accent.withValues(alpha: 0.3)
                        : Colors.transparent,
                    borderRadius: BorderRadius.circular(6),
                    border:
                        sel ? Border.all(color: theme.accent, width: 1) : null),
                child: Center(
                    child: Container(
                        width: w * 2,
                        height: w * 2,
                        decoration:
                            BoxDecoration(color: sc, shape: BoxShape.circle)))),
          );
        }),
        Container(
            width: 1, height: 16, color: theme.accent.withValues(alpha: 0.2)),
        const SizedBox(width: 8),
        ...[Colors.white, Colors.cyan, Colors.red, Colors.green, Colors.amber]
            .map((c) {
          final sel = _strokeColor == c;
          return GestureDetector(
            onTap: () => setState(() => _strokeColor = c),
            child: Container(
                width: 20,
                height: 20,
                margin: const EdgeInsets.only(right: 6),
                decoration: BoxDecoration(
                    color: c,
                    shape: BoxShape.circle,
                    border: sel
                        ? Border.all(color: theme.accent, width: 2)
                        : Border.all(
                            color: Colors.white.withValues(alpha: 0.2),
                            width: 1))),
          );
        }),
        const Spacer(),
        GestureDetector(
          onTap: () => setState(() => _autoRecognize = !_autoRecognize),
          child: Row(children: [
            Text('Auto',
                style: TextStyle(
                    color: theme.keySecondaryText.withValues(alpha: 0.5),
                    fontSize: 9)),
            const SizedBox(width: 4),
            Container(
                width: 28,
                height: 16,
                decoration: BoxDecoration(
                    color: _autoRecognize
                        ? theme.accent
                        : Colors.white.withValues(alpha: 0.2),
                    borderRadius: BorderRadius.circular(8)),
                child: Align(
                    alignment: _autoRecognize
                        ? Alignment.centerRight
                        : Alignment.centerLeft,
                    child: Container(
                        width: 12,
                        height: 12,
                        margin: const EdgeInsets.all(2),
                        decoration: const BoxDecoration(
                            color: Colors.white, shape: BoxShape.circle)))),
          ]),
        ),
        if (!_autoRecognize) ...[
          const SizedBox(width: 8),
          GestureDetector(
            onTap:
                _strokes.isNotEmpty && !_isRecognizing ? _recognize : null,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                  color: theme.accent,
                  borderRadius: BorderRadius.circular(10)),
              child: Text('Read',
                  style: TextStyle(
                      color: theme.background,
                      fontSize: 10,
                      fontWeight: FontWeight.bold)),
            ),
          ),
        ],
      ]),
    );
  }

  Widget _buildSuggestions(AkaiPalette theme, Color sc) {
    if (_suggestions.isEmpty && !_isRecognizing) {
      return Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          child: Text(
              _modelState == _ModelState.ready
                  ? 'Draw characters or words below — tap a match to type it'
                  : 'Handwriting works fully offline after a one-time setup',
              style: TextStyle(
                  color: theme.keySecondaryText.withValues(alpha: 0.35),
                  fontSize: 10,
                  fontStyle: FontStyle.italic)));
    }
    return SizedBox(
      height: 44,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
        child: _isRecognizing
            ? Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                SizedBox(
                    width: 14,
                    height: 14,
                    child:
                        CircularProgressIndicator(strokeWidth: 1.5, color: sc)),
                const SizedBox(width: 8),
                Text('Reading...',
                    style: TextStyle(
                        color: sc.withValues(alpha: 0.6), fontSize: 11))
              ])
            : ListView.builder(
                scrollDirection: Axis.horizontal,
                itemCount: _suggestions.length,
                itemBuilder: (ctx, i) {
                  final s = _suggestions[i];
                  return GestureDetector(
                      onTap: () => _insertSuggestion(s),
                      child: Container(
                          margin: const EdgeInsets.only(right: 8),
                          padding: const EdgeInsets.symmetric(
                              horizontal: 14, vertical: 6),
                          decoration: BoxDecoration(
                              color: sc.withValues(alpha: i == 0 ? 0.28 : 0.12),
                              borderRadius: BorderRadius.circular(18),
                              border: Border.all(
                                  color: sc.withValues(
                                      alpha: i == 0 ? 0.7 : 0.3))),
                          child: Center(
                              child: Text(s,
                                  style: TextStyle(
                                      color: sc,
                                      fontSize: 16,
                                      fontWeight: FontWeight.bold)))));
                }),
      ),
    );
  }

  /// Shown instead of the canvas until the recognition model is available.
  Widget _modelGate(AkaiPalette theme) {
    final isAm = _lang == HandwritingService.amharic;
    final langName = isAm ? 'Amharic (አማርኛ)' : 'English';

    Widget child;
    switch (_modelState) {
      case _ModelState.checking:
        child = CircularProgressIndicator(
            strokeWidth: 2, color: theme.accent.withValues(alpha: 0.6));
        break;
      case _ModelState.downloading:
        child = Column(mainAxisSize: MainAxisSize.min, children: [
          CircularProgressIndicator(strokeWidth: 2, color: theme.accent),
          const SizedBox(height: 10),
          Text('Downloading $langName model…',
              style: TextStyle(color: theme.keyText, fontSize: 12)),
          Text('about 20 MB, one time only',
              style: TextStyle(
                  color: theme.keySecondaryText.withValues(alpha: 0.5),
                  fontSize: 10)),
        ]);
        break;
      case _ModelState.failed:
      case _ModelState.missing:
        child = Column(mainAxisSize: MainAxisSize.min, children: [
          Icon(Icons.cloud_download_outlined,
              color: theme.accent, size: 30),
          const SizedBox(height: 8),
          Text(
              _modelState == _ModelState.failed
                  ? 'Download failed — check your connection'
                  : 'Get the $langName handwriting model',
              style: TextStyle(color: theme.keyText, fontSize: 12)),
          const SizedBox(height: 10),
          ElevatedButton(
            onPressed: _downloadModel,
            style: ElevatedButton.styleFrom(
                backgroundColor: theme.accent,
                foregroundColor: theme.background,
                padding:
                    const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12))),
            child: Text(
                _modelState == _ModelState.failed ? 'Retry' : 'Download',
                style: const TextStyle(
                    fontSize: 12, fontWeight: FontWeight.bold)),
          ),
        ]);
        break;
      case _ModelState.ready:
        child = const SizedBox.shrink();
        break;
    }

    return Container(
      margin: const EdgeInsets.fromLTRB(12, 0, 12, 8),
      decoration: BoxDecoration(
          color: theme.surface.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
              color: theme.accent.withValues(alpha: 0.15), width: 1)),
      child: Center(child: child),
    );
  }

  Widget _canvas(AkaiPalette theme, Color sc, bool isMatrix) {
    return Container(
      margin: const EdgeInsets.fromLTRB(12, 0, 12, 8),
      decoration: BoxDecoration(
          color: theme.surface.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
              color: theme.accent.withValues(alpha: 0.15), width: 1)),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(16),
        child: GestureDetector(
          onPanStart: _onPanStart,
          onPanUpdate: _onPanUpdate,
          onPanEnd: _onPanEnd,
          child: CustomPaint(
              key: _canvasKey,
              painter: _Painter(
                  strokes: _strokes,
                  current: _currentPoints,
                  color: sc,
                  width: _strokeWidth,
                  isMatrix: isMatrix),
              size: Size.infinite),
        ),
      ),
    );
  }

  Widget _iconBtn(IconData icon, AkaiPalette theme, VoidCallback? onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
          padding: const EdgeInsets.all(6),
          decoration: BoxDecoration(
              color: onTap != null
                  ? theme.surface.withValues(alpha: 0.3)
                  : Colors.transparent,
              shape: BoxShape.circle),
          child: Icon(icon,
              color: onTap != null
                  ? theme.accent
                  : theme.accent.withValues(alpha: 0.3),
              size: 18)),
    );
  }
}

class _Painter extends CustomPainter {
  final List<InkStroke> strokes;
  final List<Offset> current;
  final Color color;
  final double width;
  final bool isMatrix;

  _Painter(
      {required this.strokes,
      required this.current,
      required this.color,
      required this.width,
      required this.isMatrix});

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round
      ..isAntiAlias = true;
    if (isMatrix) paint.maskFilter = const MaskFilter.blur(BlurStyle.normal, 2);

    for (final s in strokes) {
      _drawPath(canvas, s.points, paint);
    }
    if (current.isNotEmpty) _drawPath(canvas, current, paint);
  }

  void _drawPath(Canvas canvas, List<Offset> pts, Paint paint) {
    if (pts.length < 2) {
      if (pts.length == 1) {
        canvas.drawCircle(
            pts.first,
            width / 2,
            Paint()
              ..color = color
              ..isAntiAlias = true);
      }
      return;
    }
    final path = Path()..moveTo(pts.first.dx, pts.first.dy);
    for (int i = 1; i < pts.length - 1; i++) {
      final mid = Offset(
          (pts[i].dx + pts[i + 1].dx) / 2, (pts[i].dy + pts[i + 1].dy) / 2);
      path.quadraticBezierTo(pts[i].dx, pts[i].dy, mid.dx, mid.dy);
    }
    path.lineTo(pts.last.dx, pts.last.dy);
    canvas.drawPath(path, paint..strokeWidth = width);
  }

  @override
  bool shouldRepaint(_Painter old) => true;
}
