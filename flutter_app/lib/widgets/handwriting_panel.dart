import 'dart:async';
import 'dart:math';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/keyboard_provider.dart';
import '../providers/theme_provider.dart';
import '../app/theme/app_theme.dart';

class HandwritingPanel extends StatefulWidget {
  const HandwritingPanel({super.key});

  @override
  State<HandwritingPanel> createState() => _HandwritingPanelState();
}

class _StrokeData {
  final List<Offset> points;
  const _StrokeData(this.points);
  _StrokeData copy() => _StrokeData(List<Offset>.from(points));
}

class _HandwritingPanelState extends State<HandwritingPanel> {
  final List<_StrokeData> _strokes = [];
  final List<_StrokeData> _undoStack = [];
  final List<_StrokeData> _redoStack = [];
  List<Offset> _currentStroke = [];
  double _strokeWidth = 4.0;
  Color _strokeColor = Colors.white;
  bool _autoRecognize = true;
  bool _isRecognizing = false;
  List<String> _suggestions = [];
  int _strokeCount = 0;
  Timer? _recognizeTimer;

  void _onPanStart(DragStartDetails details, RenderBox renderBox) {
    setState(() {
      _currentStroke = [renderBox.globalToLocal(details.globalPosition)];
    });
  }

  void _onPanUpdate(DragUpdateDetails details, RenderBox renderBox) {
    setState(() {
      _currentStroke.add(renderBox.globalToLocal(details.globalPosition));
    });
  }

  void _onPanEnd(DragEndDetails details) {
    if (_currentStroke.isNotEmpty) {
      setState(() {
        _undoStack.add(_StrokeData(_currentStroke.toList()));
        _redoStack.clear();
        _strokes.add(_StrokeData(_currentStroke.toList()));
        _currentStroke = [];
        _strokeCount = _strokes.length;
      });

      if (_autoRecognize) {
        _recognizeTimer?.cancel();
        _recognizeTimer = Timer(const Duration(milliseconds: 1200), () {
          if (mounted && _strokes.isNotEmpty) _recognizeHandwriting();
        });
      }
    }
  }

  void _undo() {
    if (_undoStack.isEmpty) return;
    setState(() {
      _redoStack.add(_StrokeData(_strokes.last.points.toList()));
      _strokes.removeLast();
      _strokeCount = _strokes.length;
    });
  }

  void _redo() {
    if (_redoStack.isEmpty) return;
    setState(() {
      final stroke = _redoStack.removeLast();
      _strokes.add(stroke);
      _strokeCount = _strokes.length;
    });
  }

  void _clearCanvas() {
    if (_strokes.isNotEmpty) {
      _undoStack.addAll(_strokes.map((s) => s.copy()));
      _redoStack.clear();
    }
    setState(() {
      _strokes.clear();
      _currentStroke = [];
      _suggestions = [];
      _strokeCount = 0;
    });
  }

  Future<void> _recognizeHandwriting() async {
    if (_strokes.isEmpty) return;
    setState(() => _isRecognizing = true);
    await Future.delayed(const Duration(milliseconds: 800));
    if (mounted) {
      setState(() {
        _isRecognizing = false;
        _suggestions = _getMockSuggestions();
      });
    }
  }

  List<String> _getMockSuggestions() {
    final random = Random();
    final en = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    final am = ['ሀ', 'ለ', 'መ', 'ሰ', 'በ', 'ወ', 'ነ', 'ገ'];
    return List.generate(5, (_) {
      final chars = random.nextBool() ? en : am;
      return chars[random.nextInt(chars.length)];
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
          Expanded(child: _canvas(theme, sc, isMatrix)),
          if (_suggestionsList.isNotEmpty) _actionBar(theme),
        ]),
      ),
    );
  }

  List<String> get _suggestionsList => _suggestions;

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
        if (_strokeCount > 0) ...[
          const SizedBox(width: 6),
          Text('$_strokeCount strokes',
              style: TextStyle(
                  color: theme.keySecondaryText.withValues(alpha: 0.4),
                  fontSize: 9))
        ],
        const Spacer(),
        _iconBtn(Icons.undo, theme, _undoStack.isNotEmpty ? _undo : null),
        const SizedBox(width: 8),
        _iconBtn(Icons.redo, theme, _redoStack.isNotEmpty ? _redo : null),
        const SizedBox(width: 8),
        if (_strokes.isNotEmpty)
          GestureDetector(
            onTap: _isRecognizing ? null : _recognizeHandwriting,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
              decoration: BoxDecoration(
                  color: theme.accent, borderRadius: BorderRadius.circular(12)),
              child: Row(mainAxisSize: MainAxisSize.min, children: [
                if (_isRecognizing)
                  SizedBox(
                      width: 12,
                      height: 12,
                      child: CircularProgressIndicator(
                          strokeWidth: 1.5, color: theme.background))
                else
                  Icon(Icons.auto_awesome, color: theme.background, size: 14),
                const SizedBox(width: 4),
                Text('AI',
                    style: TextStyle(
                        color: theme.background,
                        fontSize: 10,
                        fontWeight: FontWeight.bold)),
              ]),
            ),
          ),
        const SizedBox(width: 8),
        _iconBtn(Icons.delete_outline, theme, _clearCanvas),
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
            Text('Auto-AI',
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
      ]),
    );
  }

  Widget _buildSuggestions(AkaiPalette theme, Color sc) {
    if (_suggestionsList.isEmpty && !_isRecognizing) {
      return Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          child: Text('Draw characters, words, or sentences below',
              style: TextStyle(
                  color: theme.keySecondaryText.withValues(alpha: 0.3),
                  fontSize: 10,
                  fontStyle: FontStyle.italic)));
    }
    return Container(
      height: 50,
      padding: const EdgeInsets.symmetric(horizontal: 12),
      child: _isRecognizing
          ? Row(mainAxisAlignment: MainAxisAlignment.center, children: [
              SizedBox(
                  width: 14,
                  height: 14,
                  child:
                      CircularProgressIndicator(strokeWidth: 1.5, color: sc)),
              const SizedBox(width: 8),
              Text('Analysing...',
                  style:
                      TextStyle(color: sc.withValues(alpha: 0.6), fontSize: 11))
            ])
          : ListView.builder(
              scrollDirection: Axis.horizontal,
              itemCount: _suggestionsList.length,
              itemBuilder: (ctx, i) {
                final s = _suggestionsList[i];
                return GestureDetector(
                    onTap: () => _insertSuggestion(s),
                    child: Container(
                        margin: const EdgeInsets.only(right: 8),
                        padding: const EdgeInsets.symmetric(
                            horizontal: 14, vertical: 8),
                        decoration: BoxDecoration(
                            color: sc.withValues(alpha: 0.15),
                            borderRadius: BorderRadius.circular(20),
                            border:
                                Border.all(color: sc.withValues(alpha: 0.3))),
                        child: Center(
                            child: Text(s,
                                style: TextStyle(
                                    color: sc,
                                    fontSize: 16,
                                    fontWeight: FontWeight.bold)))));
              }),
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
          onPanStart: (d) =>
              _onPanStart(d, context.findRenderObject() as RenderBox),
          onPanUpdate: (d) =>
              _onPanUpdate(d, context.findRenderObject() as RenderBox),
          onPanEnd: _onPanEnd,
          child: CustomPaint(
              painter: _Painter(
                  strokes: _strokes,
                  current: _currentStroke,
                  color: sc,
                  width: _strokeWidth,
                  isMatrix: isMatrix),
              size: Size.infinite),
        ),
      ),
    );
  }

  Widget _actionBar(AkaiPalette theme) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
          color: theme.surface.withValues(alpha: 0.2),
          border: Border(
              top: BorderSide(color: theme.accent.withValues(alpha: 0.1)))),
      child: SizedBox(
        width: double.infinity,
        child: ElevatedButton(
          onPressed: _suggestionsList.isNotEmpty
              ? () => _insertSuggestion(_suggestionsList.first)
              : null,
          style: ElevatedButton.styleFrom(
              backgroundColor: theme.accent,
              foregroundColor: theme.background,
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12)),
              padding: const EdgeInsets.symmetric(vertical: 10)),
          child: Text(
              'Insert "${_suggestionsList.isNotEmpty ? _suggestionsList.first : ''}"',
              style:
                  const TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
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
  final List<_StrokeData> strokes;
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
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round
      ..isAntiAlias = true;
    if (isMatrix) paint.maskFilter = const MaskFilter.blur(BlurStyle.normal, 2);

    for (final s in strokes) _drawPath(canvas, s.points, paint);
    if (current.isNotEmpty) _drawPath(canvas, current, paint);
  }

  void _drawPath(Canvas canvas, List<Offset> pts, Paint paint) {
    if (pts.length < 2) {
      if (pts.length == 1) canvas.drawCircle(pts.first, width / 2, paint);
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
