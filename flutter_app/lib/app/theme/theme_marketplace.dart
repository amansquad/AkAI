import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../theme/app_theme.dart';
import '../theme/theme_download_service.dart';
import '../settings/settings_provider.dart';

class ThemeMarketplace extends StatefulWidget {
  final ThemeDownloadService downloadService;

  const ThemeMarketplace({super.key, required this.downloadService});

  @override
  State<ThemeMarketplace> createState() => _ThemeMarketplaceState();
}

class _ThemeMarketplaceState extends State<ThemeMarketplace> {
  List<DownloadableTheme> _availableThemes = [];
  List<AkaiPalette> _downloadedThemes = [];
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadThemes();
  }

  Future<void> _loadThemes() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final available = await widget.downloadService.getAvailableThemes();
      final downloaded = await widget.downloadService.getDownloadedThemes();

      setState(() {
        _availableThemes = available;
        _downloadedThemes = downloaded;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = 'Failed to load themes. Please try again.';
        _isLoading = false;
      });
    }
  }

  Future<void> _downloadTheme(DownloadableTheme theme) async {
    try {
      final success = await widget.downloadService.downloadTheme(theme);
      if (success) {
        await _loadThemes();
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('${theme.name} downloaded successfully!'),
              backgroundColor: Colors.green,
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to download ${theme.name}'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  Future<void> _deleteTheme(DownloadableTheme theme) async {
    try {
      final success = await widget.downloadService.deleteTheme(theme.id);
      if (success) {
        await _loadThemes();
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('${theme.name} deleted'),
              backgroundColor: Colors.orange,
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to delete ${theme.name}'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  void _applyTheme(AkaiPalette palette) {
    final settings = context.read<AkaiSettingsProvider>();
    settings.setPalette(palette);
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('${palette.name} theme applied!'),
          backgroundColor: palette.accent,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final settings = context.watch<AkaiSettingsProvider>();
    final palette = settings.palette;

    return Scaffold(
      backgroundColor: palette.background,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: Text(
          'Theme Marketplace',
          style: TextStyle(
            color: palette.keyText,
            fontWeight: FontWeight.w800,
            fontSize: 24,
          ),
        ),
        leading: IconButton(
          icon: Icon(Icons.arrow_back_ios_new_rounded, color: palette.keyText),
          onPressed: () => Navigator.of(context).pop(),
        ),
        actions: [
          IconButton(
            icon: Icon(Icons.refresh_rounded, color: palette.keyText),
            onPressed: _loadThemes,
          ),
        ],
      ),
      body: _buildBody(palette),
    );
  }

  Widget _buildBody(AkaiPalette palette) {
    if (_isLoading) {
      return Center(
        child: CircularProgressIndicator(
          color: palette.accent,
        ),
      );
    }

    if (_error != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.error_outline_rounded,
              color: palette.keySecondaryText,
              size: 64,
            ),
            const SizedBox(height: 16),
            Text(
              _error!,
              style: TextStyle(
                color: palette.keySecondaryText,
                fontSize: 16,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: _loadThemes,
              style: ElevatedButton.styleFrom(
                backgroundColor: palette.accent,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              child: const Text('Retry'),
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _loadThemes,
      color: palette.accent,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Downloaded Themes Section
          if (_downloadedThemes.isNotEmpty) ...[
            _SectionHeader(
              palette: palette,
              title: 'Downloaded Themes',
              icon: Icons.download_done_rounded,
            ),
            const SizedBox(height: 12),
            ..._downloadedThemes.map((theme) => _DownloadedThemeCard(
                  palette: palette,
                  theme: theme,
                  onApply: () => _applyTheme(theme),
                )),
            const SizedBox(height: 24),
          ],

          // Available Themes Section
          _SectionHeader(
            palette: palette,
            title: 'Available Themes',
            icon: Icons.store_rounded,
          ),
          const SizedBox(height: 12),

          if (_availableThemes.isEmpty)
            _EmptyState(palette: palette)
          else
            ..._availableThemes.map((theme) => _AvailableThemeCard(
                  palette: palette,
                  theme: theme,
                  onDownload: () => _downloadTheme(theme),
                  onDelete: () => _deleteTheme(theme),
                )),
        ],
      ),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  final AkaiPalette palette;
  final String title;
  final IconData icon;

  const _SectionHeader({
    required this.palette,
    required this.title,
    required this.icon,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, color: palette.accent, size: 20),
        const SizedBox(width: 8),
        Text(
          title.toUpperCase(),
          style: TextStyle(
            color: palette.accent,
            fontSize: 12,
            fontWeight: FontWeight.w800,
            letterSpacing: 1.2,
          ),
        ),
      ],
    );
  }
}

class _DownloadedThemeCard extends StatelessWidget {
  final AkaiPalette palette;
  final AkaiPalette theme;
  final VoidCallback onApply;

  const _DownloadedThemeCard({
    required this.palette,
    required this.theme,
    required this.onApply,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: palette.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: palette.surfaceVariant),
      ),
      child: Row(
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: theme.accent.withValues(alpha: 0.2),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Center(
              child: Text(
                theme.emoji,
                style: const TextStyle(fontSize: 24),
              ),
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  theme.name,
                  style: TextStyle(
                    color: palette.keyText,
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 4),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                  decoration: BoxDecoration(
                    color: palette.accent.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    'Downloaded',
                    style: TextStyle(
                      color: palette.accent,
                      fontSize: 10,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
              ],
            ),
          ),
          ElevatedButton(
            onPressed: onApply,
            style: ElevatedButton.styleFrom(
              backgroundColor: palette.accent,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(10),
              ),
            ),
            child: const Text('Apply'),
          ),
        ],
      ),
    );
  }
}

class _AvailableThemeCard extends StatelessWidget {
  final AkaiPalette palette;
  final DownloadableTheme theme;
  final VoidCallback onDownload;
  final VoidCallback onDelete;

  const _AvailableThemeCard({
    required this.palette,
    required this.theme,
    required this.onDownload,
    required this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: palette.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: theme.isPremium
              ? palette.accent.withValues(alpha: 0.5)
              : palette.surfaceVariant,
          width: theme.isPremium ? 1.5 : 1,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: palette.surfaceVariant,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Center(
                  child: Text(
                    theme.emoji,
                    style: const TextStyle(fontSize: 24),
                  ),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Text(
                          theme.name,
                          style: TextStyle(
                            color: palette.keyText,
                            fontSize: 16,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        if (theme.isPremium) ...[
                          const SizedBox(width: 8),
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(
                              gradient: LinearGradient(
                                colors: [palette.accent, palette.glow],
                              ),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: const Text(
                              'PRO',
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 8,
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                          ),
                        ],
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      theme.description,
                      style: TextStyle(
                        color: palette.keySecondaryText,
                        fontSize: 12,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: theme.isDownloaded ? onDelete : onDownload,
                  style: OutlinedButton.styleFrom(
                    foregroundColor:
                        theme.isDownloaded ? Colors.red : palette.accent,
                    side: BorderSide(
                      color: theme.isDownloaded ? Colors.red : palette.accent,
                    ),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10),
                    ),
                  ),
                  child: Text(theme.isDownloaded ? 'Delete' : 'Download'),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _EmptyState extends StatelessWidget {
  final AkaiPalette palette;

  const _EmptyState({required this.palette});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(32),
      decoration: BoxDecoration(
        color: palette.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: palette.surfaceVariant),
      ),
      child: Center(
        child: Column(
          children: [
            Icon(
              Icons.palette_rounded,
              color: palette.keySecondaryText,
              size: 48,
            ),
            const SizedBox(height: 16),
            Text(
              'No themes available',
              style: TextStyle(
                color: palette.keyText,
                fontSize: 18,
                fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Check back later for new themes!',
              style: TextStyle(
                color: palette.keySecondaryText,
                fontSize: 14,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
