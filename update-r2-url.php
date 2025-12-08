<?php
// Update R2_PUBLIC_URL in .env file
$envFile = '.env';
$envContent = file_get_contents($envFile);

// Replace the R2_PUBLIC_URL line
$envContent = preg_replace(
    '/^R2_PUBLIC_URL=.*$/m',
    'R2_PUBLIC_URL=https://pub-cd42bce9da7242b69d703b8bf1e9e4b6.r2.dev',
    $envContent
);

file_put_contents($envFile, $envContent);
echo "✓ Updated R2_PUBLIC_URL in .env file\n";
echo "Public URL: https://pub-cd42bce9da7242b69d703b8bf1e9e4b6.r2.dev\n";
?>
