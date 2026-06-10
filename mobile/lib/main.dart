import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'providers/auth_provider.dart';
import 'providers/client_provider.dart';
import 'utils/theme.dart';
import 'utils/router.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // TODO: Initialize Firebase when configured
  // await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);

  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(create: (_) => ClientProvider()),
      ],
      child: const DreamAbroadApp(),
    ),
  );
}

class DreamAbroadApp extends StatelessWidget {
  const DreamAbroadApp({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<AuthProvider>(
      builder: (context, authProvider, _) {
        // Show splash screen while auth is initializing
        if (!authProvider.initialized) {
          return MaterialApp(
            title: 'Dream Abroad',
            theme: AppTheme.lightTheme,
            darkTheme: AppTheme.darkTheme,
            themeMode: ThemeMode.system,
            debugShowCheckedModeBanner: false,
            home: Scaffold(
              backgroundColor: AppTheme.primaryColor,
              body: Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: AppTheme.backgroundColor.withOpacity(0.1),
                      ),
                      child: Icon(
                        Icons.home_rounded,
                        size: 80,
                        color: AppTheme.accentColor,
                      ),
                    ),
                    const SizedBox(height: 24),
                    const Text(
                      'Dream Abroad',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 24,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: 16),
                    const CircularProgressIndicator(color: Colors.white),
                  ],
                ),
              ),
            ),
          );
        }

        final router = AppRouter.getRouter(authProvider.isAuthenticated);
        return MaterialApp.router(
          title: 'Dream Abroad',
          theme: AppTheme.lightTheme,
          darkTheme: AppTheme.darkTheme,
          themeMode: ThemeMode.system,
          routerConfig: router,
          debugShowCheckedModeBanner: false,
        );
      },
    );
  }
}
