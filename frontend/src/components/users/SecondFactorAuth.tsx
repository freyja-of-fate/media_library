import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";

import { useAuth } from "@/context/AuthContext";
import { userService, ApiException } from "@/api";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import FormAlerts from "@/components/common/FormAlerts";
import { useTabTitle } from "@/hooks/useTabTitle";

type Mode = "setup" | "login" | "disable";

const SecondFactorAuth = () => {
  const { current_user } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();

  const mode: Mode =
    (location.state?.mode as Mode) || "setup";

  const [qr, setQr] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");

  const [recoveryCodes, setRecoveryCodes] =
    useState<string[] | null>(null);
  
  const challenge_token = location.state?.challenge_token || null;
  const { login } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Title
  useTabTitle(
    mode === "setup"
      ? "Setup 2FA"
      : mode === "disable"
      ? "Disable 2FA"
      : "Two-Factor Login"
  );

  // Start setup
  const handleInitSetup = async () => {
    setError("");
    setLoading(true);

    try {
      const data = await userService.setup2FA();
      setQr(data.qr_code);
    } catch (err) {
      if (err instanceof ApiException) {
        setError(err.message);
      } else {
        setError("Failed to initialize 2FA setup");
      }
    } finally {
      setLoading(false);
    }
  };

  // Verify / submit
  const handleSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      // Setup flow
      if (mode === "setup") {
        const data =
          await userService.verify2FA(code);

        setRecoveryCodes(
          data.recovery_codes
        );

        return;
      }

      // Login flow
      if (mode === "login") {
        const data = await userService.verifyLogin2FA(challenge_token, code);

        if (data.type === 'success') {
          // store JWT + user
          login(data.token, data.user)
          navigate(`/users/${data.user.id}`)
        }

        // error
        if (data.type === 'error') {
          setError(data.error)
        }
      }

      // Disable flow
      if (mode === "disable") {
        await userService.disable2FA(
          password,
          code
        );

        navigate(
          `/users/${current_user?.id}`
        );

        return;
      }
    } catch (err) {
      if (err instanceof ApiException) {
        setError(err.message);
      } else {
        setError(
          "An error occurred. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // Recovery codes screen
  if (recoveryCodes) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>
              Recovery Codes
            </CardTitle>

            <CardDescription>
              Store these somewhere safe.
              They will not be shown
              again. You may use these in place of your authenticator once per code.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="rounded-md bg-muted p-4 font-mono text-sm space-y-1">
              {recoveryCodes.map(
                (code) => (
                  <div key={code}>
                    {code}
                  </div>
                )
              )}
            </div>

            <Button
              className="w-full"
              onClick={() =>
                navigate(
                  `/users/${current_user?.id}`
                )
              }
            >
              Finish Setup
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Setup intro screen
  if (mode === "setup" && !qr) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>
              Enable Two-Factor Authentication
            </CardTitle>

            <CardDescription>
              Add an extra layer of
              security to your account
              using an authenticator
              app.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <FormAlerts error={error} />

            <Button
              onClick={handleInitSetup}
              disabled={loading}
              className="w-full"
            >
              {loading && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}

              {loading
                ? "Initializing..."
                : "Enable 2FA"}
            </Button>

            <Button
              variant="outline"
              className="w-full"
              onClick={() =>
                navigate(
                  `/users/${current_user?.id}`
                )
              }
            >
              Skip for Now
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Shared verify screen
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>
            {mode === "setup"
              ? "Verify Authenticator"
              : mode === "login"
              ? "Two-Factor Login"
              : "Disable Two-Factor Authentication"}
          </CardTitle>

          <CardDescription>
            {mode === "setup"
              ? "Scan the QR code and enter the generated code."
              : mode === "login"
              ? "Enter your authenticator code to continue."
              : "Confirm your password and authenticator code to disable 2FA."}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            <FormAlerts error={error} />

            {mode === "setup" && qr && (
              <div className="flex justify-center">
                <img
                  src={qr}
                  alt="2FA QR Code"
                  className="w-48 h-48 rounded-md border"
                />
              </div>
            )}

            {mode === "disable" && (
              <div className="space-y-2">
                <Label htmlFor="password">
                  Current Password
                </Label>

                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  autoFocus
                  onChange={(e) =>
                    setPassword(
                      e.target.value
                    )
                  }
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="code">
                Authenticator Code
              </Label>

              <Input
                id="code"
                placeholder="123456"
                value={code}
                autoFocus={mode !== 'disable'}
                onChange={(e) =>
                  setCode(e.target.value)
                }
                required
              />
            </div>

            <Button
              type="submit"
              disabled={
                loading ||
                code.length < 6
              }
              className="w-full"
            >
              {loading && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}

              {loading
                ? "Submitting..."
                : mode === "setup"
                ? "Verify & Enable"
                : mode === "disable"
                ? "Disable 2FA"
                : "Verify"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default SecondFactorAuth;