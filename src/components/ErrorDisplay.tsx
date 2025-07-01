import React from "react";
import { AlertTriangle, RefreshCw, WifiOff } from "lucide-react";
import type { ApolloError } from "@apollo/client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ErrorDisplayProps {
  error: ApolloError | Error;
  onRetry?: () => void;
  title?: string;
  className?: string;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  onRetry,
  title = "Error al cargar datos",
  className,
}) => {
  const getErrorIcon = () => {
    if (error.message.includes("Network") || error.message.includes("fetch")) {
      return <WifiOff className="h-4 w-4" />;
    }
    return <AlertTriangle className="h-4 w-4" />;
  };

  const getErrorMessage = () => {
    if (error.message.includes("Network")) {
      return "Error de conexión. Verifica tu conexión a internet.";
    }
    if (error.message.includes("fetch")) {
      return "No se pudo conectar con el servidor. Inténtalo más tarde.";
    }
    if (error.message.includes("GraphQL")) {
      return "Error en la consulta de datos. Verifica los parámetros.";
    }
    return error.message || "Ha ocurrido un error inesperado.";
  };

  const isNetworkError =
    error.message.includes("Network") || error.message.includes("fetch");

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-destructive">
          {getErrorIcon()}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert variant="destructive">
          {getErrorIcon()}
          <AlertTitle>
            {isNetworkError ? "Error de Conexión" : "Error de Datos"}
          </AlertTitle>
          <AlertDescription>{getErrorMessage()}</AlertDescription>
        </Alert>

        {onRetry && (
          <Button onClick={onRetry} variant="outline" className="w-full">
            <RefreshCw className="mr-2 h-4 w-4" />
            Reintentar
          </Button>
        )}

        <details className="text-xs text-muted-foreground">
          <summary className="cursor-pointer mb-2">Detalles técnicos</summary>
          <pre className="whitespace-pre-wrap bg-muted p-2 rounded">
            {JSON.stringify(error, null, 2)}
          </pre>
        </details>
      </CardContent>
    </Card>
  );
};

interface InlineErrorProps {
  error: string | Error;
  onRetry?: () => void;
  className?: string;
}

export const InlineError: React.FC<InlineErrorProps> = ({
  error,
  onRetry,
  className,
}) => {
  const errorMessage = typeof error === "string" ? error : error.message;

  return (
    <Alert variant="destructive" className={className}>
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription className="flex items-center justify-between">
        <span>{errorMessage}</span>
        {onRetry && (
          <Button variant="ghost" size="sm" onClick={onRetry}>
            <RefreshCw className="h-3 w-3" />
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
};
