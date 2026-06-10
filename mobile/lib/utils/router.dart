import 'package:go_router/go_router.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../screens/auth/login_screen.dart';
import '../screens/auth/register_screen.dart';
import '../screens/home/home_screen.dart';
import '../screens/profile/profile_screen.dart';
import '../screens/profile/edit_profile_screen.dart';
import '../screens/contracts/contracts_screen.dart';
import '../screens/contracts/contract_detail_screen.dart';
import '../screens/requests/requests_screen.dart';
import '../screens/requests/new_request_screen.dart';
import '../screens/payments/payments_screen.dart';
import '../screens/documents/documents_screen.dart';
import '../screens/property/property_screen.dart';
import '../screens/home/alerts_screen.dart';
import '../screens/auth/splash_screen.dart';
import '../screens/messages/messages_screen.dart';
import '../screens/news/news_screen.dart';
import '../screens/rewards/rewards_screen.dart';
import '../screens/checkin/checkin_screen.dart';
import '../screens/reviews/reviews_screen.dart';
import '../screens/faq/faq_screen.dart';
import '../screens/referrals/referrals_screen.dart';

class AppRouter {
  static final GlobalKey<NavigatorState> _rootNavigatorKey =
      GlobalKey<NavigatorState>();
  static final GlobalKey<NavigatorState> _shellNavigatorKey =
      GlobalKey<NavigatorState>();

  static GoRouter getRouter(bool isAuthenticated) {
    return GoRouter(
      navigatorKey: _rootNavigatorKey,
      initialLocation: isAuthenticated ? '/home' : '/login',
      redirect: (BuildContext context, GoRouterState state) {
        final isAuth = isAuthenticated;
        final isAuthRoute =
            state.matchedLocation == '/login' || state.matchedLocation == '/register';

        // Redirect to login if not authenticated and trying to access protected route
        if (!isAuth && !isAuthRoute) {
          return '/login';
        }

        // Redirect to home if authenticated and trying to access auth routes
        if (isAuth && isAuthRoute) {
          return '/home';
        }

        return null;
      },
      routes: [
        // Auth Routes
        GoRoute(
          path: '/login',
          name: 'login',
          builder: (context, state) => const LoginScreen(),
        ),
        GoRoute(
          path: '/register',
          name: 'register',
          builder: (context, state) => const RegisterScreen(),
        ),

        // Main Shell Route with Bottom Navigation
        ShellRoute(
          navigatorKey: _shellNavigatorKey,
          builder: (context, state, child) {
            return HomeShell(child: child);
          },
          routes: [
            GoRoute(
              path: '/home',
              name: 'home',
              builder: (context, state) => const HomeScreen(),
            ),
            GoRoute(
              path: '/contracts',
              name: 'contracts',
              builder: (context, state) => const ContractsScreen(),
              routes: [
                GoRoute(
                  path: ':id',
                  name: 'contract_detail',
                  builder: (context, state) {
                    final contractId = int.tryParse(state.pathParameters['id'] ?? '') ?? 0;
                    return ContractDetailScreen(contractId: contractId);
                  },
                ),
              ],
            ),
            GoRoute(
              path: '/requests',
              name: 'requests',
              builder: (context, state) => const RequestsScreen(),
              routes: [
                GoRoute(
                  path: 'new',
                  name: 'new_request',
                  builder: (context, state) => const NewRequestScreen(),
                ),
              ],
            ),
            GoRoute(
              path: '/payments',
              name: 'payments',
              builder: (context, state) => const PaymentsScreen(),
            ),
            GoRoute(
              path: '/documents',
              name: 'documents',
              builder: (context, state) => const DocumentsScreen(),
            ),
            GoRoute(
              path: '/property',
              name: 'property',
              builder: (context, state) => const PropertyScreen(),
            ),
            GoRoute(
              path: '/alerts',
              name: 'alerts',
              builder: (context, state) => const AlertsScreen(),
            ),
            GoRoute(
              path: '/messages',
              name: 'messages',
              builder: (context, state) => const MessagesScreen(),
            ),
            GoRoute(
              path: '/news',
              name: 'news',
              builder: (context, state) => const NewsScreen(),
            ),
            GoRoute(
              path: '/rewards',
              name: 'rewards',
              builder: (context, state) => const RewardsScreen(),
            ),
            GoRoute(
              path: '/checkin',
              name: 'checkin',
              builder: (context, state) => const CheckInScreen(),
            ),
            GoRoute(
              path: '/reviews',
              name: 'reviews',
              builder: (context, state) => const ReviewsScreen(),
            ),
            GoRoute(
              path: '/faq',
              name: 'faq',
              builder: (context, state) => const FaqScreen(),
            ),
            GoRoute(
              path: '/referrals',
              name: 'referrals',
              builder: (context, state) => const ReferralsScreen(),
            ),
            GoRoute(
              path: '/profile',
              name: 'profile',
              builder: (context, state) => const ProfileScreen(),
              routes: [
                GoRoute(
                  path: 'edit',
                  name: 'edit_profile',
                  builder: (context, state) {
                    final extra = state.extra as Map<String, dynamic>?;
                    return EditProfileScreen(
                      profile: extra?['profile'],
                      onSaved: extra?['onSaved'] ?? () {},
                    );
                  },
                ),
              ],
            ),
          ],
        ),

        // Splash Screen
        GoRoute(
          path: '/splash',
          name: 'splash',
          builder: (context, state) => const SplashScreen(),
        ),
      ],
      errorBuilder: (context, state) => Scaffold(
        appBar: AppBar(title: const Text('Error')),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.error_outline, size: 64, color: Colors.red),
              const SizedBox(height: 16),
              Text(
                'Page not found',
                style: Theme.of(context).textTheme.headlineSmall,
              ),
              const SizedBox(height: 8),
              Text(
                state.error?.message ?? 'An error occurred',
                style: Theme.of(context).textTheme.bodyMedium,
              ),
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: () => context.go('/home'),
                child: const Text('Go to Home'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Widget that provides the shell for main app navigation
class HomeShell extends StatefulWidget {
  final Widget child;

  const HomeShell({
    required this.child,
    Key? key,
  }) : super(key: key);

  @override
  State<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends State<HomeShell> {
  late int _selectedIndex;

  @override
  void initState() {
    super.initState();
    _selectedIndex = 0;
  }

  void _onItemTapped(int index) {
    final routes = ['/home', '/contracts', '/requests', '/payments', '/profile'];
    if (index < routes.length) {
      context.go(routes[index]);
    }
  }

  int _getSelectedIndex(BuildContext context) {
    final location = GoRouterState.of(context).matchedLocation;
    if (location.startsWith('/contracts')) return 1;
    if (location.startsWith('/requests')) return 2;
    if (location.startsWith('/payments')) return 3;
    if (location.startsWith('/profile')) return 4;
    return 0; // home
  }

  @override
  Widget build(BuildContext context) {
    final selectedIndex = _getSelectedIndex(context);

    return Scaffold(
      body: widget.child,
      bottomNavigationBar: NavigationBar(
        selectedIndex: selectedIndex,
        onDestinationSelected: _onItemTapped,
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.home_outlined),
            selectedIcon: Icon(Icons.home),
            label: 'Início',
          ),
          NavigationDestination(
            icon: Icon(Icons.description_outlined),
            selectedIcon: Icon(Icons.description),
            label: 'Contratos',
          ),
          NavigationDestination(
            icon: Icon(Icons.build_outlined),
            selectedIcon: Icon(Icons.build),
            label: 'Pedidos',
          ),
          NavigationDestination(
            icon: Icon(Icons.receipt_long_outlined),
            selectedIcon: Icon(Icons.receipt_long),
            label: 'Pagamentos',
          ),
          NavigationDestination(
            icon: Icon(Icons.person_outline),
            selectedIcon: Icon(Icons.person),
            label: 'Perfil',
          ),
        ],
      ),
      floatingActionButton: selectedIndex == 2
          ? FloatingActionButton(
              onPressed: () => context.go('/requests/new'),
              tooltip: 'New Request',
              child: const Icon(Icons.add),
            )
          : null,
    );
  }
}
