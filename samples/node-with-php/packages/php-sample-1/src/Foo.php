<?php

namespace Sample;

use Psr\Container\ContainerInterface;
use Psr\Http\Message\ResponseInterface;

class Foo
{
    const SERVICE_VIEW = 'SERVICE_VIEW';

    const SERVICE_FLASH_MESSAGES = 'SERVICE_FLASH_MESSAGES';

    const SERVICE_USER = 'SERVICE_USER';

    const ANALYTICS = 'ANALYTICS';

    /** @var ContainerInterface */
    protected $container;

    /**
     * AbstractController constructor.
     */
    public function __construct(ContainerInterface $container)
    {
        $this->container = $container;
    }

    /**
     * @param  mixed  $tplName
     * @param  mixed  $key
     * @return mixed
     */
    public function render(ResponseInterface $response, $tplName = '', $key = [])
    {
        $viewService =
            $this->container->get(self::SERVICE_VIEW);
        $flashService = $this->container
            ->get(self::SERVICE_FLASH_MESSAGES);

        if (! isset($key['flashMessages'])) {
            $key['flashMessages'] = $flashService->getMessages();
        }

        if (! isset($key['userService'])) {
            $key['userService'] = $this->container->get(self::SERVICE_USER);
        }

        if (! isset($key['analyticsService'])) {
            $key['analyticsService'] = $this->container->get(self::ANALYTICS);
        }

        return $viewService->render($response, $tplName, $key);

    }
}
