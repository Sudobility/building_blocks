#!/bin/bash

# push_all.sh - Project-specific configuration for push_projects.sh
#
# This script defines the list of projects to process and sources the
# reusable push_projects.sh script from the workflows repo.
#
# Usage:
#   ./push_all.sh                              # Update deps and process only projects with changes
#   ./push_all.sh --force                      # Force version bump on all projects
#   ./push_all.sh --subpackages                # Also process sub-packages in /packages directories
#   ./push_all.sh --starting-project <name>    # Skip projects until reaching <name>
#   ./push_all.sh --help                       # Show help message

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BASE_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

# Define projects in dependency order with wait times
# Format: "relative_path:wait_after_in_seconds"
#
# Wait times are used for packages that need CI/CD to complete publishing
# before dependent packages can fetch the new version from npm.
PROJECTS=(
    # Non-package / infrastructure
    "../workflows:0"
    "../sudobility_dockerized:0"
    # Level 0: No internal @sudobility dependencies
    "../types:0"
    "../seo_lib:0"
    "../design_system:0"
    "../windows_canvas_rn:0"
    "../guard_worker:60"
    # Level 1: Depends only on level 0 packages
    "../di:0"
    "../printing_core:0"
    "../routing:0"
    "../mail_box_components:0"
    "../mail_box_components_rn:60"
    # Level 2: Depends on level 0 + level 1
    "../auth_lib:0"
    "../auth_service:0"
    "../entity_client:0"
    "../entity_service:0"
    "../printing:0"
    "../printing_rn:0"
    "../ratelimit_client:0"
    "../ratelimit_service:0"
    "../resources_client:0"
    "../resources_service:0"
    "../seo_lib:60"
    # Level 3: Depends on levels 0-2
    "../di_web:0"
    "../di_rn:0"
    "../consumables_client:0"
    "../consumables_service:0"
    "../subscription_lib:0"
    "../subscription_service:0"
    # NOTE: subscription_pages / subscription_pages_rn must precede di_web / di_rn.
    # The RevenueCat adapters moved out of subscription_lib into these pages
    # packages, and di_web/di_rn now consume them, so they must publish first.
    # Level 4: Depends on levels 0-3
    "../building_blocks:0"
    "../building_blocks_rn:60"
    # Level 5: entity_pages / entity_pages_rn now host
    # SudobilityAppWithFirebaseAuthAndEntities, which composes building_blocks'
    # app shell, so they must publish after building_blocks/building_blocks_rn
    # (and after subscription_pages, which they also consume).
    "../consumables_pages:0"
    "../consumables_pages_rn:0"
    "../entity_pages:0"
    "../entity_pages_rn:0"
    "../ratelimit_pages:0"
    "../resources_pages:0"
    "../subscription_pages:0"
    "../subscription_pages_rn:0"
)

# Source reusable script: prefer local workflows repo, fall back to GitHub
LOCAL_SCRIPT="$(cd "$BASE_DIR" && pwd)/../workflows/scripts/push_projects.sh"
if [ -f "$LOCAL_SCRIPT" ]; then
    source "$LOCAL_SCRIPT"
else
    PUSH_SCRIPT=$(mktemp)
    trap "rm -f $PUSH_SCRIPT" EXIT
    if ! curl -fsSL "https://raw.githubusercontent.com/johnqh/workflows/main/scripts/push_projects.sh" -o "$PUSH_SCRIPT"; then
        echo "Error: Failed to download push_projects.sh from GitHub"
        exit 1
    fi
    source "$PUSH_SCRIPT"
fi

# Parse command-line arguments
parse_args "$@"

# Run the push process
run_push_projects "$BASE_DIR" "${PROJECTS[@]}"
