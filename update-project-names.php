<?php
/**
 * Script to update project names from PROJECT-XXXXXXXX to PRO-XXXXXXXX format
 *
 * This script updates all project values in the database that start with "PROJECT-"
 * to use the shorter "PRO-" prefix instead.
 *
 * Usage: php update-project-names.php
 */

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

    // Start transaction
    $pdo->beginTransaction();

    // Find all projects with PROJECT- prefix in name or contract_number
    $stmt = $pdo->prepare("
        SELECT id, name, contract_number
        FROM projects
        WHERE name LIKE 'PROJECT-%' OR contract_number LIKE 'PROJECT-%'
    ");
    $stmt->execute();
    $projects = $stmt->fetchAll();

    echo "Found " . count($projects) . " projects to update\n\n";

    if (count($projects) === 0) {
        echo "No projects need updating. Exiting.\n";
        $pdo->rollBack();
        exit(0);
    }

    // Update each project
    $updateStmt = $pdo->prepare("
        UPDATE projects
        SET name = :name, contract_number = :contract_number
        WHERE id = :id
    ");

    $updatedCount = 0;
    foreach ($projects as $project) {
        $newName = preg_replace('/PROJECT-/i', 'PRO-', $project['name']);
        $newContractNumber = preg_replace('/PROJECT-/i', 'PRO-', $project['contract_number']);

        // Only update if something changed
        if ($newName !== $project['name'] || $newContractNumber !== $project['contract_number']) {
            $updateStmt->execute([
                ':id' => $project['id'],
                ':name' => $newName,
                ':contract_number' => $newContractNumber
            ]);

            echo "Updated project ID {$project['id']}:\n";
            if ($newName !== $project['name']) {
                echo "  name: {$project['name']} -> {$newName}\n";
            }
            if ($newContractNumber !== $project['contract_number']) {
                echo "  contract_number: {$project['contract_number']} -> {$newContractNumber}\n";
            }
            echo "\n";

            $updatedCount++;
        }
    }

    // Commit transaction
    $pdo->commit();

    echo "\n";
    echo "Successfully updated $updatedCount projects\n";
    echo "All project names now use PRO- prefix instead of PROJECT-\n";

} catch (PDOException $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    echo "Database error: " . $e->getMessage() . "\n";
    exit(1);
} catch (Exception $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
}
