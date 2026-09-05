import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";
import { Layout } from "@/components/Layout";
import { AdminLayout } from "@/components/AdminLayout";
import { DashboardLayout } from "@/components/DashboardLayout";

// Public pages
import HomePage from "@/pages/HomePage";
import AboutPage from "@/pages/AboutPage";
import ServicesPage from "@/pages/ServicesPage";
import ProcessPage from "@/pages/ProcessPage";
import PricingPage from "@/pages/PricingPage";
import ReferralPage from "@/pages/ReferralPage";
import SuccessStoriesPage from "@/pages/SuccessStoriesPage";
import BlogPage from "@/pages/BlogPage";
import FAQPage from "@/pages/FAQPage";
import ContactPage from "@/pages/ContactPage";
import TrackCasePage from "@/pages/TrackCasePage";

// Tax & Legal service pages
import TaxLegalServicesPage from "@/pages/TaxLegalServicesPage";
import GSTServicesPage from "@/pages/GSTServicesPage";
import ITRFilingPage from "@/pages/ITRFilingPage";
import MSMERegistrationPage from "@/pages/MSMERegistrationPage";
import BusinessRegistrationPage from "@/pages/BusinessRegistrationPage";
import LegalDocumentationPage from "@/pages/LegalDocumentationPage";

// Policy pages
import PrivacyPolicyPage from "@/pages/PrivacyPolicyPage";
import TermsPage from "@/pages/TermsPage";
import RefundPolicyPage from "@/pages/RefundPolicyPage";
import DisclaimerPage from "@/pages/DisclaimerPage";

// Auth pages
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import AdminLoginPage from "@/pages/AdminLoginPage";

// Dashboard pages
import DashboardHome from "@/pages/dashboard/DashboardHome";
import DashboardCase from "@/pages/dashboard/DashboardCase";
import DashboardDocuments from "@/pages/dashboard/DashboardDocuments";
import DashboardPayments from "@/pages/dashboard/DashboardPayments";
import DashboardTickets from "@/pages/dashboard/DashboardTickets";
import DashboardNotifications from "@/pages/dashboard/DashboardNotifications";

// Admin pages
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminLeads from "@/pages/admin/AdminLeads";
import AdminCustomers from "@/pages/admin/AdminCustomers";
import AdminCases from "@/pages/admin/AdminCases";
import AdminPayments from "@/pages/admin/AdminPayments";
import AdminDocuments from "@/pages/admin/AdminDocuments";
import AdminReferrals from "@/pages/admin/AdminReferrals";
import AdminTickets from "@/pages/admin/AdminTickets";

import StaffLoginPage from "@/pages/staff/StaffLoginPage";
import StaffDashboard from "@/pages/staff/StaffDashboard";
import StaffCases from "@/pages/staff/StaffCases";
import StaffCaseDetail from "@/pages/staff/StaffCaseDetail";
import StaffTasks from "@/pages/staff/StaffTasks";
import StaffDocuments from "@/pages/staff/StaffDocuments";
import StaffNotifications from "@/pages/staff/StaffNotifications";
import StaffActivity from "@/pages/staff/StaffActivity";
import StaffProfile from "@/pages/staff/StaffProfile";
import AdminStaff from "@/pages/admin/AdminStaff";
import { StaffLayout } from "@/components/StaffLayout";
import { InstallAppPrompt } from "@/components/InstallAppPrompt";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30000 } },
});

function ProtectedDashboard({ children }: { children: React.ReactNode }) {
  const { data: user, isLoading } = useGetMe({ query: { queryKey: getGetMeQueryKey() } });
  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><div className="text-muted-foreground">Loading...</div></div>;
  if (!user) return <Redirect to="/login" />;
  if (user.role === "STAFF") return <Redirect to="/staff" />;
  if (user.role !== "CUSTOMER") return <Redirect to="/admin" />;
  return <DashboardLayout>{children}</DashboardLayout>;
}

function ProtectedAdmin({ children }: { children: React.ReactNode }) {
  const { data: user, isLoading } = useGetMe({ query: { queryKey: getGetMeQueryKey() } });
  if (isLoading) return <div className="min-h-screen bg-slate-900 flex items-center justify-center"><div className="text-slate-400">Loading...</div></div>;
  if (!user) return <Redirect to="/admin/login" />;
  if (user.role === "CUSTOMER") return <Redirect to="/dashboard" />;
  if (user.role === "STAFF") return <Redirect to="/staff" />;
  return <AdminLayout>{children}</AdminLayout>;
}

function ProtectedStaff({ children }: { children: React.ReactNode }) {
  const { data: user, isLoading } = useGetMe({ query: { queryKey: getGetMeQueryKey() } });
  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><div className="text-muted-foreground">Loading...</div></div>;
  if (!user) return <Redirect to="/staff/login" />;
  if (user.role === "CUSTOMER") return <Redirect to="/dashboard" />;
  if (user.role !== "STAFF") return <Redirect to="/admin" />;
  return <StaffLayout>{children}</StaffLayout>;
}

function Router() {
  return (
    <Switch>
      {/* Public */}
      <Route
        path="/"
        component={() => (
          <>
            <Layout><HomePage /></Layout>
            <InstallAppPrompt />
          </>
        )}
      />
      <Route path="/about" component={() => <Layout><AboutPage /></Layout>} />
      <Route path="/services" component={() => <Layout><ServicesPage /></Layout>} />
      <Route path="/process" component={() => <Layout><ProcessPage /></Layout>} />
      <Route path="/pricing" component={() => <Layout><PricingPage /></Layout>} />
      <Route path="/referral" component={() => <Layout><ReferralPage /></Layout>} />
      <Route path="/success-stories" component={() => <Layout><SuccessStoriesPage /></Layout>} />
      <Route path="/blog" component={() => <Layout><BlogPage /></Layout>} />
      <Route path="/faq" component={() => <Layout><FAQPage /></Layout>} />
      <Route path="/contact" component={() => <Layout><ContactPage /></Layout>} />
      <Route path="/track" component={() => <Layout><TrackCasePage /></Layout>} />

      {/* Tax & Legal service pages */}
      <Route path="/tax-legal" component={() => <Layout><TaxLegalServicesPage /></Layout>} />
      <Route path="/gst-services" component={() => <Layout><GSTServicesPage /></Layout>} />
      <Route path="/itr-filing" component={() => <Layout><ITRFilingPage /></Layout>} />
      <Route path="/msme-registration" component={() => <Layout><MSMERegistrationPage /></Layout>} />
      <Route path="/business-registration" component={() => <Layout><BusinessRegistrationPage /></Layout>} />
      <Route path="/legal-documentation" component={() => <Layout><LegalDocumentationPage /></Layout>} />

      {/* Policy pages */}
      <Route path="/privacy" component={() => <Layout><PrivacyPolicyPage /></Layout>} />
      <Route path="/terms" component={() => <Layout><TermsPage /></Layout>} />
      <Route path="/refund-policy" component={() => <Layout><RefundPolicyPage /></Layout>} />
      <Route path="/disclaimer" component={() => <Layout><DisclaimerPage /></Layout>} />

      {/* Auth */}
      <Route path="/login" component={LoginPage} />
      <Route path="/register" component={RegisterPage} />
      <Route path="/admin/login" component={AdminLoginPage} />

      {/* Customer Dashboard */}
      <Route path="/dashboard" component={() => <ProtectedDashboard><DashboardHome /></ProtectedDashboard>} />
      <Route path="/dashboard/case" component={() => <ProtectedDashboard><DashboardCase /></ProtectedDashboard>} />
      <Route path="/dashboard/documents" component={() => <ProtectedDashboard><DashboardDocuments /></ProtectedDashboard>} />
      <Route path="/dashboard/payments" component={() => <ProtectedDashboard><DashboardPayments /></ProtectedDashboard>} />
      <Route path="/dashboard/tickets" component={() => <ProtectedDashboard><DashboardTickets /></ProtectedDashboard>} />
      <Route path="/dashboard/notifications" component={() => <ProtectedDashboard><DashboardNotifications /></ProtectedDashboard>} />

      {/* Admin */}
      <Route path="/admin" component={() => <ProtectedAdmin><AdminDashboard /></ProtectedAdmin>} />
      <Route path="/admin/leads" component={() => <ProtectedAdmin><AdminLeads /></ProtectedAdmin>} />
      <Route path="/admin/customers" component={() => <ProtectedAdmin><AdminCustomers /></ProtectedAdmin>} />
      <Route path="/admin/cases" component={() => <ProtectedAdmin><AdminCases /></ProtectedAdmin>} />
      <Route path="/admin/payments" component={() => <ProtectedAdmin><AdminPayments /></ProtectedAdmin>} />
      <Route path="/admin/documents" component={() => <ProtectedAdmin><AdminDocuments /></ProtectedAdmin>} />
      <Route path="/admin/referrals" component={() => <ProtectedAdmin><AdminReferrals /></ProtectedAdmin>} />
      <Route path="/admin/tickets" component={() => <ProtectedAdmin><AdminTickets /></ProtectedAdmin>} />
      <Route path="/admin/staff" component={() => <ProtectedAdmin><AdminStaff /></ProtectedAdmin>} />

      {/* Staff Workspace */}
      <Route path="/staff/login" component={StaffLoginPage} />
      <Route path="/staff" component={() => <ProtectedStaff><StaffDashboard /></ProtectedStaff>} />
      <Route path="/staff/cases" component={() => <ProtectedStaff><StaffCases /></ProtectedStaff>} />
      <Route path="/staff/cases/:id" component={() => <ProtectedStaff><StaffCaseDetail /></ProtectedStaff>} />
      <Route path="/staff/tasks" component={() => <ProtectedStaff><StaffTasks /></ProtectedStaff>} />
      <Route path="/staff/documents" component={() => <ProtectedStaff><StaffDocuments /></ProtectedStaff>} />
      <Route path="/staff/notifications" component={() => <ProtectedStaff><StaffNotifications /></ProtectedStaff>} />
      <Route path="/staff/activity" component={() => <ProtectedStaff><StaffActivity /></ProtectedStaff>} />
      <Route path="/staff/profile" component={() => <ProtectedStaff><StaffProfile /></ProtectedStaff>} />

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
