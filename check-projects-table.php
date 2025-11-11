<?php
// Database configuration from b5-api-2/.env
$host = 'c-c9q0ajkg37dkflk2ghiu.rw.mdb.yandexcloud.net';
$database = 'bonus-5';
$username = 'bonus_user_db';
$password = 'wQrh9S8rGkKUKYG';

try {
    // SSL certificate path (from b5-api-2)
    $sslCertPath = __DIR__ . '/../b5-api-2/cert/root.crt';

    // Connect to database with SSL
    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ];

    // Add SSL if certificate exists
    if (file_exists($sslCertPath)) {
        $options[PDO::MYSQL_ATTR_SSL_CA] = $sslCertPath;
        $options[PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT] = false;
    }

    $pdo = new PDO(
        "mysql:host=$host;dbname=$database;charset=utf8mb4",
        $username,
        $password,
        $options
    );

    echo "Connected to database successfully\n\n";

    // Get table structure
    $stmt = $pdo->query("DESCRIBE projects");
    $columns = $stmt->fetchAll();

    echo "Projects table structure:\n";
    echo str_repeat("=", 80) . "\n";
    foreach ($columns as $column) {
        echo sprintf("%-30s %-20s %s\n",
            $column['Field'],
            $column['Type'],
            $column['Key'] ? "[{$column['Key']}]" : ''
        );
    }
    echo str_repeat("=", 80) . "\n\n";

    // Get sample project
    $stmt = $pdo->query("SELECT * FROM projects LIMIT 1");
    $sample = $stmt->fetch();

    if ($sample) {
        echo "Sample project data:\n";
        echo str_repeat("=", 80) . "\n";
        echo json_encode($sample, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        echo "\n" . str_repeat("=", 80) . "\n";
    }

} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
}
